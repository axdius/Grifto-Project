import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { imageRefSchema, moneySchema } from "./common";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type Category = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  title: z.string(),
  description: z.string(),
  image: imageRefSchema.nullable(),
  price: moneySchema,
});
export type Product = z.infer<typeof productSchema>;

export const catalogEndpoints = {
  listCategories: defineEndpoint({
    method: "GET",
    path: "/v1/categories",
    response: z.object({ items: z.array(categorySchema) }),
  }),
  listProducts: defineEndpoint({
    method: "GET",
    path: "/v1/products",
    query: z.object({
      search: z.string().optional(),
      categoryId: z.string().optional(),
    }),
    response: z.object({ items: z.array(productSchema) }),
  }),
} as const;
