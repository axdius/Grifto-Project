"use client";

import { useState } from "react";
import { useDeleteWishlistItem, useMyWishlist, useWishlistItems } from "@grifto/sdk";
import { Button, EmptyState, Spinner } from "@grifto/ui";
import { formatMoney } from "@grifto/utils";
import { ItemCard } from "./item-card";
import { AddItemDialog } from "./add-item-dialog";
import { ShareDialog } from "./share-dialog";

export function WishlistManager() {
  const wishlist = useMyWishlist();
  const items = useWishlistItems(wishlist.data?.id);
  const deleteItem = useDeleteWishlistItem(wishlist.data?.id ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (wishlist.isLoading || items.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }
  if (!wishlist.data) {
    return <EmptyState title="Couldn't load your wishlist" description={wishlist.error?.message} />;
  }

  const list = items.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">{wishlist.data.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {list.length} {list.length === 1 ? "gift" : "gifts"} ·{" "}
            {formatMoney(wishlist.data.totalFunded)} funded so far
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            Share
          </Button>
          <Button onClick={() => setAddOpen(true)}>Add Wishlist Item</Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Add gifts manually, from a product link, or from the Grifto catalog."
          action={<Button onClick={() => setAddOpen(true)}>Add your first gift</Button>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              deleting={deleteItem.isPending && deletingId === item.id}
              onDelete={(itemId) => {
                setDeletingId(itemId);
                deleteItem.mutate({ itemId });
              }}
            />
          ))}
        </div>
      )}

      <AddItemDialog
        wishlistId={wishlist.data.id}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
      <ShareDialog wishlist={wishlist.data} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
