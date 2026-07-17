import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { imageRefSchema, isoDateTime, moneySchema } from "./common";

export const itemSourceSchema = z.enum(["manual", "url", "catalog"]);
export type ItemSource = z.infer<typeof itemSourceSchema>;

/** Funding lifecycle per the scope PDF. */
export const itemStatusSchema = z.enum(["open", "partially_funded", "fully_funded", "reserved"]);
export type ItemStatus = z.infer<typeof itemStatusSchema>;

export const wishlistItemSchema = z.object({
  id: z.string(),
  wishlistId: z.string(),
  source: itemSourceSchema,
  productId: z.string().nullable(),
  title: z.string(),
  image: imageRefSchema.nullable(),
  productUrl: z.string().url().nullable(),
  price: moneySchema,
  funded: moneySchema,
  /** Derived on the server: price - funded, floored at 0. */
  remaining: moneySchema,
  /** Derived on the server: 0-100. */
  progressPercent: z.number().min(0).max(100),
  status: itemStatusSchema,
  sortOrder: z.number().int(),
  createdAt: isoDateTime,
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;

export const wishlistSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  shareSlug: z.string(),
  /** Absolute public URL for sharing (QR encodes this). */
  shareUrl: z.string(),
  itemCount: z.number().int(),
  totalFunded: moneySchema,
  createdAt: isoDateTime,
});
export type Wishlist = z.infer<typeof wishlistSchema>;

export const createItemBodySchema = z.object({
  source: itemSourceSchema,
  title: z.string().min(1, "Product title is required"),
  imageUrl: z.string().url().nullable().optional(),
  productUrl: z.string().url("Enter a valid product URL").nullable().optional(),
  priceMinor: z.number().int().positive("Estimated price is required"),
  productId: z.string().nullable().optional(),
});
export type CreateItemBody = z.infer<typeof createItemBodySchema>;

/** Result of scraping a pasted product URL (Option 2 in the PDF); fields may be missing. */
export const urlMetadataSchema = z.object({
  title: z.string().nullable(),
  imageUrl: z.string().nullable(),
  priceMinor: z.number().int().nullable(),
});
export type UrlMetadata = z.infer<typeof urlMetadataSchema>;

export const wishlistEndpoints = {
  getMyWishlist: defineEndpoint({
    method: "GET",
    path: "/v1/wishlists/me",
    auth: true,
    response: wishlistSchema,
  }),
  listItems: defineEndpoint({
    method: "GET",
    path: "/v1/wishlists/:wishlistId/items",
    auth: true,
    params: z.object({ wishlistId: z.string() }),
    response: z.object({ items: z.array(wishlistItemSchema) }),
  }),
  createItem: defineEndpoint({
    method: "POST",
    path: "/v1/wishlists/:wishlistId/items",
    auth: true,
    params: z.object({ wishlistId: z.string() }),
    body: createItemBodySchema,
    response: wishlistItemSchema,
  }),
  updateItem: defineEndpoint({
    method: "PATCH",
    path: "/v1/wishlists/:wishlistId/items/:itemId",
    auth: true,
    params: z.object({ wishlistId: z.string(), itemId: z.string() }),
    body: createItemBodySchema.partial(),
    response: wishlistItemSchema,
  }),
  deleteItem: defineEndpoint({
    method: "DELETE",
    path: "/v1/wishlists/:wishlistId/items/:itemId",
    auth: true,
    params: z.object({ wishlistId: z.string(), itemId: z.string() }),
    response: z.object({ ok: z.literal(true) }),
  }),
  fetchUrlMetadata: defineEndpoint({
    method: "POST",
    path: "/v1/wishlists/url-metadata",
    auth: true,
    body: z.object({ url: z.string().url("Enter a valid product URL") }),
    response: urlMetadataSchema,
  }),
} as const;
