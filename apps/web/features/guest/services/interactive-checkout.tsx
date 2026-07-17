"use client";

import { useEffect, useState } from "react";
import type {
  CheckoutRequest,
  CheckoutResult,
  PaymentCheckout,
} from "@grifto/platform-services";
import { Button, Dialog } from "@grifto/ui";
import { formatMoney } from "@grifto/utils";

/**
 * Interactive fake payment gateway (implements PaymentCheckout).
 *
 * Renders a checkout modal that mimics the Razorpay overlay: the tester picks
 * the outcome (pay / fail / close). When Razorpay arrives, this class is
 * replaced by a checkout.js adapter — callers are untouched.
 */
export class InteractiveFakeCheckout implements PaymentCheckout {
  private handler: ((request: CheckoutRequest) => Promise<CheckoutResult>) | null = null;

  /** Called by the host component below when it mounts. */
  _register(handler: ((request: CheckoutRequest) => Promise<CheckoutResult>) | null) {
    this.handler = handler;
  }

  open(request: CheckoutRequest): Promise<CheckoutResult> {
    if (!this.handler) {
      return Promise.resolve({ status: "failed", reason: "Checkout UI not mounted" });
    }
    return this.handler(request);
  }
}

interface PendingCheckout {
  request: CheckoutRequest;
  resolve: (result: CheckoutResult) => void;
}

/** Mount once inside providers; renders the fake gateway modal on demand. */
export function FakeCheckoutHost({ checkout }: { checkout: InteractiveFakeCheckout }) {
  const [pending, setPending] = useState<PendingCheckout | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkout._register(
      (request) =>
        new Promise<CheckoutResult>((resolve) => {
          setPending({ request, resolve });
        }),
    );
    return () => checkout._register(null);
  }, [checkout]);

  function settle(result: CheckoutResult) {
    if (!pending) return;
    setProcessing(true);
    // Small delay to mimic gateway processing.
    setTimeout(() => {
      pending.resolve(result);
      setPending(null);
      setProcessing(false);
    }, 700);
  }

  if (!pending) return null;

  return (
    <Dialog
      open
      onClose={() => settle({ status: "cancelled" })}
      title="Grifto Pay (test gateway)"
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-neutral-50 p-4">
          <p className="text-sm text-neutral-500">{pending.request.description}</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {formatMoney({
              amountMinor: pending.request.amountMinor,
              currency: pending.request.currency,
            })}
          </p>
          {pending.request.payerName ? (
            <p className="mt-1 text-xs text-neutral-400">Paying as {pending.request.payerName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Button
            className="w-full"
            loading={processing}
            onClick={() =>
              settle({ status: "success", gatewayPaymentId: `fakepay_${Date.now()}` })
            }
          >
            Pay now (simulate success)
          </Button>
          <Button
            className="w-full"
            variant="outline"
            disabled={processing}
            onClick={() => settle({ status: "failed", reason: "Card declined (simulated)" })}
          >
            Simulate payment failure
          </Button>
        </div>
        <p className="text-center text-xs text-neutral-400">
          Local test gateway — replaced by Razorpay in production.
        </p>
      </div>
    </Dialog>
  );
}
