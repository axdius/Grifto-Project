import { http } from "msw";
import {
  platformSettingsSchema,
  upsertProductBodySchema,
  type AdminContribution,
  type AdminCustomer,
  type AdminMetrics,
  type AdminWithdrawal,
} from "@grifto/contracts";
import { db, newId } from "../db/db";
import type { DbContribution, DbWithdrawal, MockDbData } from "../db/schema";
import { ok, problem, simulateLatency } from "../http";
import { computeWallet } from "./wallet";
import { toItemDto } from "./wishlist";
import { toProductDto } from "./catalog";

const INR = "INR";

function toAdminCustomer(data: MockDbData, userId: string): AdminCustomer | null {
  const user = data.users.find((u) => u.id === userId);
  if (!user) return null;
  const wishlist = data.wishlists.find((w) => w.userId === user.id);
  const items = wishlist
    ? data.wishlistItems.filter((i) => i.wishlistId === wishlist.id)
    : [];
  const wallet = computeWallet(data, user.id);
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone,
    roleType: user.roleType,
    weddingDate: user.weddingDate,
    itemCount: items.length,
    totalReceived: wallet.totalReceived,
    walletAvailable: wallet.available,
    createdAt: user.createdAt,
  };
}

function toAdminContribution(data: MockDbData, c: DbContribution): AdminContribution {
  const guest = data.guests.find((g) => g.id === c.guestId);
  const item = data.wishlistItems.find((i) => i.id === c.itemId);
  const wishlist = data.wishlists.find((w) => w.id === c.wishlistId);
  const owner = wishlist ? data.users.find((u) => u.id === wishlist.userId) : undefined;
  return {
    id: c.id,
    guestName: guest?.fullName ?? "Unknown",
    guestEmail: guest?.email ?? "",
    customerName: owner ? `${owner.firstName} ${owner.lastName}` : "Unknown",
    itemTitle: item?.title ?? "Unknown gift",
    amount: { amountMinor: c.amountMinor, currency: INR },
    status: c.status,
    createdAt: c.createdAt,
  };
}

function toAdminWithdrawal(data: MockDbData, w: DbWithdrawal): AdminWithdrawal {
  const user = data.users.find((u) => u.id === w.userId);
  return {
    id: w.id,
    customerName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
    customerEmail: user?.email ?? "",
    amount: { amountMinor: w.amountMinor, currency: INR },
    fee: { amountMinor: w.feeMinor, currency: INR },
    netAmount: { amountMinor: w.amountMinor - w.feeMinor, currency: INR },
    status: w.status,
    accountHolder: w.accountHolder,
    bankAccountLast4: w.accountNumberLast4,
    ifsc: w.ifsc,
    createdAt: w.createdAt,
    settledAt: w.settledAt,
  };
}

export const adminHandlers = [
  http.get("*/v1/admin/metrics", async () => {
    await simulateLatency();
    const data = db.get();
    const totalContributions = data.contributions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.amountMinor, 0);
    const walletBalances = data.users.reduce(
      (sum, u) => sum + computeWallet(data, u.id).available.amountMinor,
      0,
    );
    const response: AdminMetrics = {
      totalContributions: { amountMinor: totalContributions, currency: INR },
      walletBalances: { amountMinor: walletBalances, currency: INR },
      activeWeddings: data.users.filter((u) => new Date(u.weddingDate) >= new Date()).length,
      pendingPayouts: data.withdrawals.filter((w) => w.status === "requested").length,
      totalCustomers: data.users.length,
      totalGuests: data.guests.length,
    };
    return ok(response);
  }),

  http.get("*/v1/admin/customers", async ({ request }) => {
    await simulateLatency();
    const search = new URL(request.url).searchParams.get("search")?.toLowerCase() ?? "";
    const data = db.get();
    const items = data.users
      .map((u) => toAdminCustomer(data, u.id))
      .filter((c): c is AdminCustomer => c !== null)
      .filter(
        (c) =>
          !search ||
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search),
      );
    return ok({ items });
  }),

  http.get("*/v1/admin/customers/:customerId", async ({ params }) => {
    await simulateLatency();
    const data = db.get();
    const customer = toAdminCustomer(data, params.customerId as string);
    if (!customer) return problem(404, "CUSTOMER_NOT_FOUND", "Customer not found");
    const wishlist = data.wishlists.find((w) => w.userId === customer.id);
    return ok({
      customer,
      wishlistItems: wishlist
        ? data.wishlistItems.filter((i) => i.wishlistId === wishlist.id).map(toItemDto)
        : [],
      contributions: data.contributions
        .filter((c) => wishlist && c.wishlistId === wishlist.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((c) => toAdminContribution(data, c)),
      withdrawals: data.withdrawals
        .filter((w) => w.userId === customer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((w) => toAdminWithdrawal(data, w)),
    });
  }),

  http.get("*/v1/admin/contributions", async () => {
    await simulateLatency();
    const data = db.get();
    const items = [...data.contributions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((c) => toAdminContribution(data, c));
    return ok({ items });
  }),

  http.get("*/v1/admin/withdrawals", async ({ request }) => {
    await simulateLatency();
    const status = new URL(request.url).searchParams.get("status");
    const data = db.get();
    const items = data.withdrawals
      .filter((w) => !status || w.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((w) => toAdminWithdrawal(data, w));
    return ok({ items });
  }),

  http.post("*/v1/admin/withdrawals/:withdrawalId/decide", async ({ request, params }) => {
    await simulateLatency();
    const body = (await request.json()) as { decision: "approved" | "completed" | "rejected" };
    const result = db.mutate((data) => {
      const w = data.withdrawals.find((x) => x.id === params.withdrawalId);
      if (!w) return null;

      const legal: Record<string, string[]> = {
        requested: ["approved", "rejected"],
        approved: ["completed", "rejected"],
      };
      if (!legal[w.status]?.includes(body.decision)) return "illegal" as const;

      w.status = body.decision === "approved" ? "approved" : body.decision;
      const now = new Date().toISOString();

      if (body.decision === "rejected") {
        // Release the hold — funds return to available balance.
        data.ledgerEntries.push({
          id: newId("led"),
          userId: w.userId,
          direction: "credit",
          amountMinor: w.amountMinor,
          entryType: "hold_release",
          referenceType: "withdrawal",
          referenceId: w.id,
          description: `Withdrawal rejected — funds returned (····${w.accountNumberLast4})`,
          createdAt: now,
        });
        data.notifications.unshift({
          id: newId("ntf"),
          userId: w.userId,
          type: "withdrawal_rejected",
          title: "Withdrawal rejected",
          body: `Your withdrawal of ₹${(w.amountMinor / 100).toLocaleString("en-IN")} was rejected. Funds are back in your wallet.`,
          readAt: null,
          createdAt: now,
        });
      }
      if (body.decision === "completed") {
        w.settledAt = now;
        data.notifications.unshift({
          id: newId("ntf"),
          userId: w.userId,
          type: "withdrawal_completed",
          title: "Withdrawal completed",
          body: `₹${((w.amountMinor - w.feeMinor) / 100).toLocaleString("en-IN")} has been sent to your bank account ····${w.accountNumberLast4}.`,
          readAt: null,
          createdAt: now,
        });
      }
      if (body.decision === "approved") {
        data.notifications.unshift({
          id: newId("ntf"),
          userId: w.userId,
          type: "withdrawal_approved",
          title: "Withdrawal approved",
          body: `Your withdrawal of ₹${(w.amountMinor / 100).toLocaleString("en-IN")} is being processed.`,
          readAt: null,
          createdAt: now,
        });
      }
      return w;
    });
    if (result === null) return problem(404, "WITHDRAWAL_NOT_FOUND", "Withdrawal not found");
    if (result === "illegal") {
      return problem(409, "ILLEGAL_TRANSITION", "This status change is not allowed");
    }
    return ok(toAdminWithdrawal(db.get(), result));
  }),

  http.post("*/v1/admin/products", async ({ request }) => {
    await simulateLatency();
    const parsed = upsertProductBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    const product = db.mutate((data) => {
      const created = {
        id: newId("prd"),
        categoryId: body.categoryId,
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl ?? null,
        priceMinor: body.priceMinor,
      };
      data.products.push(created);
      return created;
    });
    return ok(toProductDto(product), 201);
  }),

  http.patch("*/v1/admin/products/:productId", async ({ request, params }) => {
    await simulateLatency();
    const parsed = upsertProductBodySchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const updated = db.mutate((data) => {
      const product = data.products.find((p) => p.id === params.productId);
      if (!product) return null;
      const body = parsed.data;
      if (body.title !== undefined) product.title = body.title;
      if (body.description !== undefined) product.description = body.description;
      if (body.categoryId !== undefined) product.categoryId = body.categoryId;
      if (body.priceMinor !== undefined) product.priceMinor = body.priceMinor;
      if (body.imageUrl !== undefined) product.imageUrl = body.imageUrl;
      return product;
    });
    if (!updated) return problem(404, "PRODUCT_NOT_FOUND", "Product not found");
    return ok(toProductDto(updated));
  }),

  http.delete("*/v1/admin/products/:productId", async ({ params }) => {
    await simulateLatency();
    db.mutate((data) => {
      data.products = data.products.filter((p) => p.id !== params.productId);
    });
    return ok({ ok: true });
  }),

  http.get("*/v1/admin/settings", async () => {
    await simulateLatency();
    return ok(db.get().settings);
  }),

  http.patch("*/v1/admin/settings", async ({ request }) => {
    await simulateLatency();
    const parsed = platformSettingsSchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const settings = db.mutate((data) => {
      data.settings = { ...data.settings, ...parsed.data };
      return data.settings;
    });
    return ok(settings);
  }),
];
