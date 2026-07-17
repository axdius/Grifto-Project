"use client";

import { useQuery } from "@tanstack/react-query";
import { apiContract, type Category, type Product, type PublicWishlist } from "@grifto/contracts";
import { useApiClient } from "../provider";
import type { ApiError } from "../errors";

export function useCategories() {
  const client = useApiClient();
  return useQuery<{ items: Category[] }, ApiError>({
    queryKey: ["catalog", "categories"],
    queryFn: () => client.request(apiContract.catalog.listCategories),
    staleTime: Infinity,
  });
}

export function useProducts(filters: { search?: string; categoryId?: string } = {}) {
  const client = useApiClient();
  return useQuery<{ items: Product[] }, ApiError>({
    queryKey: ["catalog", "products", filters],
    queryFn: () => client.request(apiContract.catalog.listProducts, { query: filters }),
  });
}

export function usePublicWishlist(shareSlug: string) {
  const client = useApiClient();
  return useQuery<PublicWishlist, ApiError>({
    queryKey: ["public", "wishlist", shareSlug],
    queryFn: () => client.request(apiContract.public.getWishlist, { params: { shareSlug } }),
    refetchInterval: 30_000, // live funding progress for guests
  });
}
