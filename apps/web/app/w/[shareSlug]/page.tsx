import { PublicWishlistView } from "@/features/guest/components/public-wishlist-view";

export const metadata = { title: "Wedding Wishlist — Grifto" };

export default async function PublicWishlistPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  return <PublicWishlistView shareSlug={shareSlug} />;
}
