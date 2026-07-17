"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiContract,
  type CreateItemBody,
  type UrlMetadata,
  type Wishlist,
  type WishlistItem,
} from "@grifto/contracts";
import { useApiClient } from "../provider";
import type { ApiError } from "../errors";

export const wishlistKeys = {
  mine: ["wishlist", "mine"] as const,
  items: (wishlistId: string) => ["wishlist", wishlistId, "items"] as const,
};

export function useMyWishlist() {
  const client = useApiClient();
  return useQuery<Wishlist, ApiError>({
    queryKey: wishlistKeys.mine,
    queryFn: () => client.request(apiContract.wishlist.getMyWishlist),
  });
}

export function useWishlistItems(wishlistId: string | undefined) {
  const client = useApiClient();
  return useQuery<{ items: WishlistItem[] }, ApiError>({
    queryKey: wishlistKeys.items(wishlistId ?? ""),
    queryFn: () =>
      client.request(apiContract.wishlist.listItems, { params: { wishlistId: wishlistId! } }),
    enabled: Boolean(wishlistId),
  });
}

export function useCreateWishlistItem(wishlistId: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<WishlistItem, ApiError, CreateItemBody>({
    mutationFn: (body) =>
      client.request(apiContract.wishlist.createItem, { params: { wishlistId }, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.items(wishlistId) });
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.mine });
    },
  });
}

export function useDeleteWishlistItem(wishlistId: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ ok: true }, ApiError, { itemId: string }>({
    mutationFn: ({ itemId }) =>
      client.request(apiContract.wishlist.deleteItem, { params: { wishlistId, itemId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.items(wishlistId) });
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.mine });
    },
  });
}

export function useFetchUrlMetadata() {
  const client = useApiClient();
  return useMutation<UrlMetadata, ApiError, { url: string }>({
    mutationFn: (body) => client.request(apiContract.wishlist.fetchUrlMetadata, { body }),
  });
}
