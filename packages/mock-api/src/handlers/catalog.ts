import { http } from "msw";
import type { Product } from "@grifto/contracts";
import { db } from "../db/db";
import type { DbProduct } from "../db/schema";
import { ok, simulateLatency } from "../http";

export function toProductDto(product: DbProduct): Product {
  return {
    id: product.id,
    categoryId: product.categoryId,
    title: product.title,
    description: product.description,
    image: product.imageUrl ? { url: product.imageUrl, alt: product.title } : null,
    price: { amountMinor: product.priceMinor, currency: "INR" },
  };
}

export const catalogHandlers = [
  http.get("*/v1/categories", async () => {
    await simulateLatency();
    return ok({ items: db.get().categories });
  }),

  http.get("*/v1/products", async ({ request }) => {
    await simulateLatency();
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const categoryId = url.searchParams.get("categoryId");
    const items = db
      .get()
      .products.filter(
        (p) =>
          (!categoryId || p.categoryId === categoryId) &&
          (!search || p.title.toLowerCase().includes(search)),
      )
      .map(toProductDto);
    return ok({ items });
  }),
];
