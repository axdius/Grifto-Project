import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { userRoleTypeSchema } from "./auth";
import { isoDate } from "./common";
import { wishlistItemSchema } from "./wishlist";

/**
 * Public (guest-facing) wishlist view, reached via share URL or QR code.
 * Exposes only what a guest may see — no couple contact details.
 */
export const publicWishlistSchema = z.object({
  shareSlug: z.string(),
  title: z.string(),
  /** Personalized digital invitation data (PDF: Wedding Invitation Experience). */
  invitation: z.object({
    firstName: z.string(),
    partnerName: z.string().nullable(),
    roleType: userRoleTypeSchema,
    weddingDate: isoDate,
    weddingVenue: z.string().nullable(),
    weddingMessage: z.string().nullable(),
  }),
  items: z.array(wishlistItemSchema),
});
export type PublicWishlist = z.infer<typeof publicWishlistSchema>;

export const publicEndpoints = {
  getWishlist: defineEndpoint({
    method: "GET",
    path: "/v1/public/wishlists/:shareSlug",
    params: z.object({ shareSlug: z.string() }),
    response: publicWishlistSchema,
  }),
} as const;
