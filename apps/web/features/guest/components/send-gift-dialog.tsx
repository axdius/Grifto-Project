"use client";

import { useState } from "react";
import type { GuestSession, WishlistItem } from "@grifto/contracts";
import { useSendGiftMessage } from "@grifto/sdk";
import { Button, Dialog, Field } from "@grifto/ui";

/**
 * PDF Option 3: send the gift after the wedding. Optional message + optional
 * delivery-address request that the couple must approve.
 */
export function SendGiftDialog({
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
  const send = useSendGiftMessage();
  const [message, setMessage] = useState("");
  const [requestAddress, setRequestAddress] = useState(false);
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState<null | { addressRequested: boolean }>(null);

  function close() {
    setMessage("");
    setRequestAddress(false);
    setConsent(false);
    setDone(null);
    send.reset();
    onClose();
  }

  return (
    <Dialog open={open} onClose={close} title={`Send after the wedding — ${item.title}`}>
      {done ? (
        <div className="space-y-4 text-center">
          <p className="font-semibold text-neutral-900">The couple has been notified 💌</p>
          <p className="text-sm text-neutral-500">
            {done.addressRequested
              ? "Once they approve your address request, you'll receive their delivery address by email."
              : "Your plan to send this gift has been shared with the couple."}
          </p>
          <Button className="w-full" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Let the couple know you plan to send <strong>{item.title}</strong> after the wedding.
          </p>
          <Field label="Message to the couple (optional)" htmlFor="sg-message">
            <textarea
              id="sg-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-2 focus:outline-offset-0 focus:outline-brand-200"
              placeholder="Wishing you both a lifetime of happiness…"
            />
          </Field>
          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={requestAddress}
              onChange={(e) => setRequestAddress(e.target.checked)}
              className="mt-0.5 size-4 rounded border-neutral-300 accent-brand-600"
            />
            Request the couple&apos;s delivery address (they must approve before it&apos;s shared).
          </label>
          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 rounded border-neutral-300 accent-brand-600"
            />
            I commit to sending this gift after the wedding.
          </label>
          {send.error ? (
            <p className="text-sm text-danger-600" role="alert">
              {send.error.message}
            </p>
          ) : null}
          <Button
            className="w-full"
            disabled={!consent}
            loading={send.isPending}
            onClick={() =>
              send.mutate(
                {
                  shareSlug,
                  itemId: item.id,
                  guestToken: guestSession.guestToken,
                  message: message.trim() || undefined,
                  requestAddress,
                  consent: true,
                },
                {
                  onSuccess: (res) =>
                    setDone({ addressRequested: Boolean(res.addressRequestId) }),
                },
              )
            }
          >
            Confirm
          </Button>
        </div>
      )}
    </Dialog>
  );
}
