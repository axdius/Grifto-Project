"use client";

import { useState } from "react";
import type { GuestSession, WishlistItem } from "@grifto/contracts";
import { useReserveItem } from "@grifto/sdk";
import { Button, Dialog } from "@grifto/ui";

/** PDF Option 2: "I'm bringing this gift" — reserves the item with consent. */
export function ReserveDialog({
  shareSlug,
  item,
  guestSession,
  open,
  onClose,
}: {
  shareSlug: string;
  item: WishlistItem;
  guestSession: GuestSession;
  open: boolean;
  onClose: () => void;
}) {
  const reserve = useReserveItem(shareSlug);
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);

  function close() {
    setConsent(false);
    setDone(false);
    reserve.reset();
    onClose();
  }

  return (
    <Dialog open={open} onClose={close} title={`Bring this gift — ${item.title}`}>
      {done ? (
        <div className="space-y-4 text-center">
          <p className="font-semibold text-neutral-900">This gift is booked for you 🎁</p>
          <p className="text-sm text-neutral-500">
            {item.title} is now marked as reserved so no one else funds it. The couple has been
            notified.
          </p>
          <Button className="w-full" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Reserving means you&apos;ll personally bring <strong>{item.title}</strong> to the
            wedding. The item will be marked as <strong>Gift Booked</strong> and other guests
            won&apos;t be able to contribute towards it.
          </p>
          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 rounded border-neutral-300 accent-brand-600"
            />
            I commit to bringing this gift to the wedding.
          </label>
          {reserve.error ? (
            <p className="text-sm text-danger-600" role="alert">
              {reserve.error.message}
            </p>
          ) : null}
          <Button
            className="w-full"
            disabled={!consent}
            loading={reserve.isPending}
            onClick={() =>
              reserve.mutate(
                {
                  shareSlug,
                  itemId: item.id,
                  guestToken: guestSession.guestToken,
                  consent: true,
                },
                { onSuccess: () => setDone(true) },
              )
            }
          >
            Reserve this gift
          </Button>
        </div>
      )}
    </Dialog>
  );
}
