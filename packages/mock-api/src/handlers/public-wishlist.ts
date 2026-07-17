import { http } from "msw";
import type { PublicWishlist } from "@grifto/contracts";
import { db } from "../db/db";
import { ok, problem, simulateLatency } from "../http";
import { toItemDto } from "./wishlist";

export const publicWishlistHandlers = [
  http.get("*/v1/public/wishlists/:shareSlug", async ({ params }) => {
    await simulateLatency();
    const data = db.get();
    const wishlist = data.wishlists.find((w) => w.shareSlug === params.shareSlug);
    if (!wishlist) return problem(404, "WISHLIST_NOT_FOUND", "Wishlist not found");
    const owner = data.users.find((u) => u.id === wishlist.userId);
    if (!owner) return problem(404, "WISHLIST_NOT_FOUND", "Wishlist not found");

    const response: PublicWishlist = {
      shareSlug: wishlist.shareSlug,
      title: wishlist.title,
      invitation: {
        firstName: owner.firstName,
        partnerName: owner.partnerName,
        roleType: owner.roleType,
        weddingDate: owner.weddingDate,
        weddingVenue: owner.weddingVenue,
        weddingMessage: owner.weddingMessage,
      },
      items: data.wishlistItems
        .filter((i) => i.wishlistId === wishlist.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(toItemDto),
    };
    return ok(response);
  }),
];
