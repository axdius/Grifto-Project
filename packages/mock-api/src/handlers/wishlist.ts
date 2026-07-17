import { http } from "msw";
import {
  createItemBodySchema,
  type UrlMetadata,
  type Wishlist,
  type WishlistItem,
} from "@grifto/contracts";
import { db, newId } from "../db/db";
import type { DbWishlist, DbWishlistItem, MockDbData } from "../db/schema";
import { authenticate, ok, problem, simulateLatency, unauthorized } from "../http";

const CURRENCY = "INR";

/** DTO mapping — the single place funding math is derived (like the real backend). */
export function toItemDto(item: DbWishlistItem): WishlistItem {
  const remaining = Math.max(0, item.priceMinor - item.fundedMinor);
  return {
    id: item.id,
    wishlistId: item.wishlistId,
    source: item.source,
    productId: item.productId,
    title: item.title,
    image: item.imageUrl ? { url: item.imageUrl, alt: item.title } : null,
    productUrl: item.productUrl,
    price: { amountMinor: item.priceMinor, currency: CURRENCY },
    funded: { amountMinor: item.fundedMinor, currency: CURRENCY },
    remaining: { amountMinor: remaining, currency: CURRENCY },
    progressPercent: Math.min(100, Math.round((item.fundedMinor / item.priceMinor) * 100)),
    status: item.status,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
  };
}

function toWishlistDto(wishlist: DbWishlist, data: MockDbData): Wishlist {
  const items = data.wishlistItems.filter((i) => i.wishlistId === wishlist.id);
  return {
    id: wishlist.id,
    userId: wishlist.userId,
    title: wishlist.title,
    shareSlug: wishlist.shareSlug,
    shareUrl: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/w/${wishlist.shareSlug}`,
    itemCount: items.length,
    totalFunded: {
      amountMinor: items.reduce((sum, i) => sum + i.fundedMinor, 0),
      currency: CURRENCY,
    },
    createdAt: wishlist.createdAt,
  };
}

function ownedWishlist(userId: string, wishlistId: string): DbWishlist | null {
  const wl = db.get().wishlists.find((w) => w.id === wishlistId);
  return wl && wl.userId === userId ? wl : null;
}

export const wishlistHandlers = [
  http.get("*/v1/wishlists/me", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    const data = db.get();
    const wishlist = data.wishlists.find((w) => w.userId === user.id);
    if (!wishlist) return problem(404, "WISHLIST_NOT_FOUND", "Wishlist not found");
    return ok(toWishlistDto(wishlist, data));
  }),

  http.get("*/v1/wishlists/:wishlistId/items", async ({ request, params }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    if (!ownedWishlist(user.id, params.wishlistId as string)) {
      return problem(404, "WISHLIST_NOT_FOUND", "Wishlist not found");
    }
    const items = db
      .get()
      .wishlistItems.filter((i) => i.wishlistId === params.wishlistId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toItemDto);
    return ok({ items });
  }),

  http.post("*/v1/wishlists/:wishlistId/items", async ({ request, params }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    if (!ownedWishlist(user.id, params.wishlistId as string)) {
      return problem(404, "WISHLIST_NOT_FOUND", "Wishlist not found");
    }
    const parsed = createItemBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    const item = db.mutate((data) => {
      const newItem: DbWishlistItem = {
        id: newId("itm"),
        wishlistId: params.wishlistId as string,
        source: body.source,
        productId: body.productId ?? null,
        title: body.title,
        imageUrl: body.imageUrl ?? null,
        productUrl: body.productUrl ?? null,
        priceMinor: body.priceMinor,
        fundedMinor: 0,
        status: "open",
        sortOrder: data.wishlistItems.filter((i) => i.wishlistId === params.wishlistId).length,
        createdAt: new Date().toISOString(),
      };
      data.wishlistItems.push(newItem);
      return newItem;
    });
    return ok(toItemDto(item), 201);
  }),

  http.patch("*/v1/wishlists/:wishlistId/items/:itemId", async ({ request, params }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    if (!ownedWishlist(user.id, params.wishlistId as string)) {
      return problem(404, "WISHLIST_NOT_FOUND", "Wishlist not found");
    }
    const parsed = createItemBodySchema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const updated = db.mutate((data) => {
      const item = data.wishlistItems.find((i) => i.id === params.itemId);
      if (!item) return null;
      const body = parsed.data;
      if (body.title !== undefined) item.title = body.title;
      if (body.imageUrl !== undefined) item.imageUrl = body.imageUrl;
      if (body.productUrl !== undefined) item.productUrl = body.productUrl;
      if (body.priceMinor !== undefined) item.priceMinor = body.priceMinor;
      return item;
    });
    if (!updated) return problem(404, "ITEM_NOT_FOUND", "Wishlist item not found");
    return ok(toItemDto(updated));
  }),

  http.delete("*/v1/wishlists/:wishlistId/items/:itemId", async ({ request, params }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    if (!ownedWishlist(user.id, params.wishlistId as string)) {
      return problem(404, "WISHLIST_NOT_FOUND", "Wishlist not found");
    }
    db.mutate((data) => {
      data.wishlistItems = data.wishlistItems.filter((i) => i.id !== params.itemId);
    });
    return ok({ ok: true });
  }),

  http.post("*/v1/wishlists/url-metadata", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    const body = (await request.json()) as { url?: string };
    // Deterministic fake scrape: derive a plausible title from the URL slug.
    // Simulates partial extraction (~25% of the time price is missing) so the
    // "complete missing fields manually" UX path gets exercised.
    let title: string | null = null;
    try {
      const slug = new URL(body.url ?? "").pathname.split("/").filter(Boolean).pop() ?? "";
      title = slug
        ? slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : null;
    } catch {
      title = null;
    }
    const response: UrlMetadata = {
      title,
      imageUrl: null,
      priceMinor: Math.random() < 0.75 ? Math.round(500 + Math.random() * 49500) * 100 : null,
    };
    return ok(response);
  }),
];
