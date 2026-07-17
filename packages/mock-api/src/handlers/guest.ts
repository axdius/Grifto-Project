import { http } from "msw";
import {
  createContributionBodySchema,
  createGiftMessageBodySchema,
  createReservationBodySchema,
  guestIdentifyBodySchema,
  type AddressRequest,
  type Contribution,
} from "@grifto/contracts";
import { db, newId } from "../db/db";
import type { DbContribution, DbGuest, DbWishlistItem, MockDbData } from "../db/schema";
import { authenticate, ok, problem, simulateLatency, unauthorized } from "../http";

// guest token scheme: "mock_gt.<guestId>" — opaque to the client.
function guestFromToken(data: MockDbData, token: string | undefined): DbGuest | null {
  if (!token?.startsWith("mock_gt.")) return null;
  const guestId = token.slice("mock_gt.".length);
  return data.guests.find((g) => g.id === guestId) ?? null;
}

function toContributionDto(c: DbContribution): Contribution {
  return {
    id: c.id,
    itemId: c.itemId,
    guestId: c.guestId,
    amount: { amountMinor: c.amountMinor, currency: "INR" },
    status: c.status,
    gatewayPaymentId: c.gatewayPaymentId,
    createdAt: c.createdAt,
  };
}

function notify(data: MockDbData, userId: string, type: string, title: string, body: string) {
  data.notifications.unshift({
    id: newId("ntf"),
    userId,
    type,
    title,
    body,
    readAt: null,
    createdAt: new Date().toISOString(),
  });
}

/** Recompute item funding status after a paid contribution. */
function applyFunding(item: DbWishlistItem, amountMinor: number) {
  item.fundedMinor += amountMinor;
  item.status =
    item.fundedMinor >= item.priceMinor
      ? "fully_funded"
      : item.fundedMinor > 0
        ? "partially_funded"
        : "open";
}

function findItemOnSlug(data: MockDbData, shareSlug: string, itemId: string) {
  const wishlist = data.wishlists.find((w) => w.shareSlug === shareSlug);
  if (!wishlist) return null;
  const item = data.wishlistItems.find((i) => i.id === itemId && i.wishlistId === wishlist.id);
  return item ? { wishlist, item } : null;
}

export const guestHandlers = [
  http.post("*/v1/guest/identify", async ({ request }) => {
    await simulateLatency();
    const parsed = guestIdentifyBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    if (!db.get().wishlists.some((w) => w.shareSlug === body.shareSlug)) {
      return problem(404, "WISHLIST_NOT_FOUND", "Wishlist not found");
    }
    const guest = db.mutate((data) => {
      const existing = data.guests.find(
        (g) => g.email.toLowerCase() === body.email.toLowerCase(),
      );
      if (existing) return existing;
      const created: DbGuest = {
        id: newId("gst"),
        fullName: body.fullName,
        email: body.email,
        createdAt: new Date().toISOString(),
      };
      data.guests.push(created);
      return created;
    });
    return ok({
      guest: { id: guest.id, fullName: guest.fullName, email: guest.email },
      guestToken: `mock_gt.${guest.id}`,
    });
  }),

  http.post("*/v1/contributions", async ({ request }) => {
    await simulateLatency();
    const parsed = createContributionBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    const data = db.get();

    const existing = data.contributions.find((c) => c.idempotencyKey === body.idempotencyKey);
    if (existing) return ok(toContributionDto(existing));

    const guest = guestFromToken(data, body.guestToken);
    if (!guest) return problem(401, "GUEST_INVALID", "Please identify yourself first");
    const found = findItemOnSlug(data, body.shareSlug, body.itemId);
    if (!found) return problem(404, "ITEM_NOT_FOUND", "Gift not found");
    if (found.item.status === "reserved") {
      return problem(409, "ITEM_RESERVED", "This gift has been reserved by another guest");
    }
    // Fully-funded race: reject over-contribution (edge case in the plan).
    const remaining = found.item.priceMinor - found.item.fundedMinor;
    if (remaining <= 0) {
      return problem(409, "ITEM_FULLY_FUNDED", "This gift is already fully funded");
    }
    if (body.amountMinor > remaining) {
      return problem(
        422,
        "AMOUNT_EXCEEDS_REMAINING",
        "Amount exceeds what's left to fund",
        `Only ₹${(remaining / 100).toLocaleString("en-IN")} is left to fund for this gift.`,
      );
    }

    const contribution = db.mutate((d) => {
      const created: DbContribution = {
        id: newId("ctb"),
        itemId: body.itemId,
        wishlistId: found.wishlist.id,
        guestId: guest.id,
        amountMinor: body.amountMinor,
        status: "pending",
        gatewayPaymentId: null,
        idempotencyKey: body.idempotencyKey,
        createdAt: new Date().toISOString(),
      };
      d.contributions.push(created);
      return created;
    });
    return ok(toContributionDto(contribution), 201);
  }),

  http.post("*/v1/contributions/:contributionId/verify", async ({ request, params }) => {
    await simulateLatency();
    const body = (await request.json()) as {
      gatewayPaymentId: string | null;
      outcome: "success" | "failed";
    };
    const result = db.mutate((data) => {
      const contribution = data.contributions.find((c) => c.id === params.contributionId);
      if (!contribution || contribution.status !== "pending") return null;

      if (body.outcome === "failed") {
        contribution.status = "failed";
        return contribution;
      }

      contribution.status = "paid";
      contribution.gatewayPaymentId = body.gatewayPaymentId;

      const item = data.wishlistItems.find((i) => i.id === contribution.itemId);
      const wishlist = data.wishlists.find((w) => w.id === contribution.wishlistId);
      const guest = data.guests.find((g) => g.id === contribution.guestId);
      if (item && wishlist && guest) {
        applyFunding(item, contribution.amountMinor);
        data.ledgerEntries.push({
          id: newId("led"),
          userId: wishlist.userId,
          direction: "credit",
          amountMinor: contribution.amountMinor,
          entryType: "contribution_credit",
          referenceType: "contribution",
          referenceId: contribution.id,
          description: `Contribution from ${guest.fullName} — ${item.title}`,
          createdAt: new Date().toISOString(),
        });
        notify(
          data,
          wishlist.userId,
          "contribution_received",
          "New contribution!",
          `${guest.fullName} contributed ₹${(contribution.amountMinor / 100).toLocaleString("en-IN")} towards ${item.title}.`,
        );
        if (item.status === "fully_funded") {
          notify(
            data,
            wishlist.userId,
            "item_fully_funded",
            "Gift fully funded 🎉",
            `${item.title} is now fully funded.`,
          );
        }
      }
      return contribution;
    });
    if (!result) {
      return problem(404, "CONTRIBUTION_NOT_FOUND", "Contribution not found or already settled");
    }
    return ok(toContributionDto(result));
  }),

  http.post("*/v1/reservations", async ({ request }) => {
    await simulateLatency();
    const parsed = createReservationBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    const data = db.get();
    const guest = guestFromToken(data, body.guestToken);
    if (!guest) return problem(401, "GUEST_INVALID", "Please identify yourself first");
    const found = findItemOnSlug(data, body.shareSlug, body.itemId);
    if (!found) return problem(404, "ITEM_NOT_FOUND", "Gift not found");
    if (found.item.status === "reserved") {
      return problem(409, "ITEM_RESERVED", "This gift is already reserved");
    }
    if (found.item.fundedMinor > 0) {
      return problem(
        409,
        "ITEM_HAS_CONTRIBUTIONS",
        "This gift already has contributions and can't be reserved",
      );
    }

    db.mutate((d) => {
      const item = d.wishlistItems.find((i) => i.id === body.itemId);
      if (item) item.status = "reserved";
      d.reservations.push({
        id: newId("rsv"),
        itemId: body.itemId,
        guestId: guest.id,
        createdAt: new Date().toISOString(),
      });
      notify(
        d,
        found.wishlist.userId,
        "item_reserved",
        "A gift was booked",
        `${guest.fullName} will be bringing ${found.item.title} to your wedding.`,
      );
    });
    return ok({ ok: true, itemId: body.itemId }, 201);
  }),

  http.post("*/v1/gift-messages", async ({ request }) => {
    await simulateLatency();
    const parsed = createGiftMessageBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    const data = db.get();
    const guest = guestFromToken(data, body.guestToken);
    if (!guest) return problem(401, "GUEST_INVALID", "Please identify yourself first");
    const found = findItemOnSlug(data, body.shareSlug, body.itemId);
    if (!found) return problem(404, "ITEM_NOT_FOUND", "Gift not found");

    const addressRequestId = db.mutate((d) => {
      const giftMessage = {
        id: newId("gms"),
        itemId: body.itemId,
        guestId: guest.id,
        message: body.message ?? null,
        createdAt: new Date().toISOString(),
      };
      d.giftMessages.push(giftMessage);
      notify(
        d,
        found.wishlist.userId,
        "gift_message",
        "A guest plans to send a gift",
        `${guest.fullName} wants to send ${found.item.title} after the wedding.`,
      );
      if (!body.requestAddress) return null;
      const requestId = newId("adr");
      d.addressRequests.push({
        id: requestId,
        giftMessageId: giftMessage.id,
        itemId: body.itemId,
        guestId: guest.id,
        userId: found.wishlist.userId,
        status: "pending",
        decidedAt: null,
        createdAt: new Date().toISOString(),
      });
      notify(
        d,
        found.wishlist.userId,
        "address_requested",
        "Address request",
        `${guest.fullName} asked for your delivery address to send ${found.item.title}.`,
      );
      return requestId;
    });
    return ok({ ok: true, addressRequestId }, 201);
  }),

  http.get("*/v1/address-requests", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    const data = db.get();
    const items: AddressRequest[] = data.addressRequests
      .filter((r) => r.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => {
        const guest = data.guests.find((g) => g.id === r.guestId);
        const item = data.wishlistItems.find((i) => i.id === r.itemId);
        const giftMessage = data.giftMessages.find((m) => m.id === r.giftMessageId);
        return {
          id: r.id,
          itemTitle: item?.title ?? "Unknown gift",
          guestName: guest?.fullName ?? "Unknown guest",
          guestEmail: guest?.email ?? "",
          message: giftMessage?.message ?? null,
          status: r.status,
          createdAt: r.createdAt,
        };
      });
    return ok({ items });
  }),

  http.post("*/v1/address-requests/:requestId/decide", async ({ request, params }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    const body = (await request.json()) as { decision: "approved" | "rejected" };
    const result = db.mutate((data) => {
      const req = data.addressRequests.find(
        (r) => r.id === params.requestId && r.userId === user.id,
      );
      if (!req || req.status !== "pending") return null;
      req.status = body.decision;
      req.decidedAt = new Date().toISOString();
      const guest = data.guests.find((g) => g.id === req.guestId);
      const item = data.wishlistItems.find((i) => i.id === req.itemId);
      return { req, guest, item };
    });
    if (!result) {
      return problem(404, "REQUEST_NOT_FOUND", "Address request not found or already decided");
    }
    return ok({
      id: result.req.id,
      itemTitle: result.item?.title ?? "Unknown gift",
      guestName: result.guest?.fullName ?? "Unknown guest",
      guestEmail: result.guest?.email ?? "",
      message: null,
      status: result.req.status,
      createdAt: result.req.createdAt,
    });
  }),
];
