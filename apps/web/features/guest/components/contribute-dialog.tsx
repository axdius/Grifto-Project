"use client";

import { useState } from "react";
import type { GuestSession, WishlistItem } from "@grifto/contracts";
import { usePaymentCheckout } from "@grifto/platform-services";
import { useCreateContribution, useVerifyContribution } from "@grifto/sdk";
import { Button, Dialog, Field, Input } from "@grifto/ui";
import { formatMoney, parseMoneyInput } from "@grifto/utils";

type Phase = "amount" | "success" | "failed";

/**
 * Contribution flow (PDF Option 1), mirroring the production sequence:
 * create pending contribution → gateway checkout → verify → funding updates.
 */
export function ContributeDialog({
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
  const checkout = usePaymentCheckout();
  const createContribution = useCreateContribution();
  const verifyContribution = useVerifyContribution(shareSlug);
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("amount");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    setPhase("amount");
    setAmount("");
    setError(null);
    onClose();
  }

  async function contribute() {
    const amountMinor = parseMoneyInput(amount);
    if (!amountMinor) return setError("Enter a valid amount");
    if (amountMinor > item.remaining.amountMinor) {
      return setError(`Only ${formatMoney(item.remaining)} is left to fund for this gift.`);
    }
    setError(null);
    setBusy(true);
    try {
      const contribution = await createContribution.mutateAsync({
        shareSlug,
        itemId: item.id,
        guestToken: guestSession.guestToken,
        amountMinor,
        idempotencyKey: crypto.randomUUID(),
      });

      const result = await checkout.open({
        orderRef: contribution.id,
        amountMinor,
        currency: "INR",
        description: `Gift contribution — ${item.title}`,
        payerName: guestSession.guest.fullName,
        payerEmail: guestSession.guest.email,
      });

      if (result.status === "cancelled") {
        // Pending contribution simply expires; guest can retry.
        return;
      }

      await verifyContribution.mutateAsync({
        contributionId: contribution.id,
        gatewayPaymentId: result.status === "success" ? result.gatewayPaymentId : null,
        outcome: result.status === "success" ? "success" : "failed",
      });
      setPhase(result.status === "success" ? "success" : "failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={close} title={`Contribute — ${item.title}`}>
      {phase === "amount" ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
            {formatMoney(item.funded)} of {formatMoney(item.price)} funded ·{" "}
            <span className="font-medium text-neutral-900">
              {formatMoney(item.remaining)} to go
            </span>
          </div>
          <Field label="Contribution Amount (₹)" htmlFor="c-amount">
            <Input
              id="c-amount"
              inputMode="decimal"
              placeholder="e.g. 5,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {[100000, 250000, 500000]
              .filter((a) => a <= item.remaining.amountMinor)
              .map((a) => (
                <Button
                  key={a}
                  size="sm"
                  variant="outline"
                  onClick={() => setAmount(String(a / 100))}
                >
                  {formatMoney({ amountMinor: a, currency: "INR" })}
                </Button>
              ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAmount(String(item.remaining.amountMinor / 100))}
            >
              Fund the rest
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-danger-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button className="w-full" size="lg" loading={busy} onClick={contribute}>
            Continue to payment
          </Button>
        </div>
      ) : null}

      {phase === "success" ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-100 text-success-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-7">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Thank you for your gift!</p>
            <p className="mt-1 text-sm text-neutral-500">
              Your contribution to {item.title} was successful. The couple has been notified.
            </p>
          </div>
          <Button className="w-full" onClick={close}>
            Done
          </Button>
        </div>
      ) : null}

      {phase === "failed" ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-danger-100 text-danger-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-7">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Payment failed</p>
            <p className="mt-1 text-sm text-neutral-500">
              Your payment didn&apos;t go through. No money was taken — you can try again.
            </p>
          </div>
          <Button className="w-full" variant="outline" onClick={() => setPhase("amount")}>
            Try again
          </Button>
        </div>
      ) : null}
    </Dialog>
  );
}
