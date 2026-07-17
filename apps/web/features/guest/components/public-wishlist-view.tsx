"use client";

import { useState } from "react";
import type { GuestSession, WishlistItem } from "@grifto/contracts";
import { usePublicWishlist } from "@grifto/sdk";
import { Button, EmptyState, Spinner } from "@grifto/ui";
import { formatDate } from "@grifto/utils";
import { ItemCard } from "@/features/wishlist/components/item-card";
import { useGuestSession } from "../hooks/use-guest-session";
import { GuestIdentifyGate } from "./guest-identify-gate";
import { ContributeDialog } from "./contribute-dialog";
import { ReserveDialog } from "./reserve-dialog";
import { SendGiftDialog } from "./send-gift-dialog";

type ActionKind = "contribute" | "reserve" | "send";

/**
 * The complete guest journey (share URL / QR target):
 * identify → digital invitation → wishlist with the three gift options.
 *
 * NOTE: client-rendered because MSW lives in the browser; in real-API mode this
 * moves to ISR server rendering (architecture doc 04) with the same components.
 */
export function PublicWishlistView({ shareSlug }: { shareSlug: string }) {
  const { data, isLoading, error } = usePublicWishlist(shareSlug);
  const guestSession = useGuestSession();
  const [action, setAction] = useState<{ kind: ActionKind; item: WishlistItem } | null>(null);

  if (isLoading || !guestSession.hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Wishlist not found"
          description="This link may be incorrect or the wishlist may have been removed."
        />
      </div>
    );
  }

  const inv = data.invitation;
  const coupleNames = inv.partnerName ? `${inv.firstName} & ${inv.partnerName}` : inv.firstName;

  if (!guestSession.session) {
    return (
      <GuestIdentifyGate
        shareSlug={shareSlug}
        coupleNames={coupleNames}
        onIdentified={(session: GuestSession) => guestSession.save(session)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Digital invitation */}
      <div className="rounded-card border border-gold-300 bg-gradient-to-b from-gold-100 to-white p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-gold-700">
          Wedding Invitation
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold text-neutral-900">{coupleNames}</h1>
        <p className="mt-3 text-sm text-neutral-600">
          {formatDate(inv.weddingDate)}
          {inv.weddingVenue ? ` · ${inv.weddingVenue}` : ""}
        </p>
        {inv.weddingMessage ? (
          <p className="mx-auto mt-4 max-w-md text-sm italic text-neutral-500">
            &ldquo;{inv.weddingMessage}&rdquo;
          </p>
        ) : null}
        <p className="mt-4 text-xs text-neutral-400">
          Welcome, {guestSession.session.guest.fullName}
        </p>
      </div>

      {/* Wishlist */}
      <h2 className="font-display mt-10 text-2xl font-bold text-neutral-900">Their Wishlist</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Contribute any amount, bring a gift yourself, or send one after the wedding.
      </p>
      <div className="mt-6 space-y-4">
        {data.items.map((item) => {
          const fundable = item.status === "open" || item.status === "partially_funded";
          return (
            <div key={item.id}>
              <ItemCard item={item} />
              <div className="mt-2 flex flex-wrap gap-2 px-1">
                {fundable ? (
                  <>
                    <Button size="sm" onClick={() => setAction({ kind: "contribute", item })}>
                      Contribute
                    </Button>
                    {item.funded.amountMinor === 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAction({ kind: "reserve", item })}
                      >
                        I&apos;m bringing this gift
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAction({ kind: "send", item })}
                    >
                      Send after the wedding
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-neutral-400">
                    {item.status === "reserved"
                      ? "A guest is bringing this gift."
                      : "This gift is fully funded — thank you!"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {data.items.length === 0 ? (
          <EmptyState title="No gifts yet" description="Check back soon!" />
        ) : null}
      </div>

      {action?.kind === "contribute" ? (
        <ContributeDialog
          shareSlug={shareSlug}
          item={action.item}
          guestSession={guestSession.session}
          open
          onClose={() => setAction(null)}
        />
      ) : null}
      {action?.kind === "reserve" ? (
        <ReserveDialog
          shareSlug={shareSlug}
          item={action.item}
          guestSession={guestSession.session}
          open
          onClose={() => setAction(null)}
        />
      ) : null}
      {action?.kind === "send" ? (
        <SendGiftDialog
          shareSlug={shareSlug}
          item={action.item}
          guestSession={guestSession.session}
          open
          onClose={() => setAction(null)}
        />
      ) : null}
    </div>
  );
}
