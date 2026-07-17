"use client";

import { useState } from "react";
import type { WalletSummary } from "@grifto/contracts";
import { useCreateWithdrawal } from "@grifto/sdk";
import { Button, Dialog, Field, Input } from "@grifto/ui";
import { formatMoney, parseMoneyInput } from "@grifto/utils";

const FEE_BPS = 200; // preview only — the (mock) API is authoritative

export function WithdrawDialog({
  wallet,
  open,
  onClose,
}: {
  wallet: WalletSummary;
  open: boolean;
  onClose: () => void;
}) {
  const withdraw = useCreateWithdrawal();
  const [amount, setAmount] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const amountMinor = parseMoneyInput(amount) ?? 0;
  const feePreview = Math.round((amountMinor * FEE_BPS) / 10000);

  function close() {
    setAmount("");
    setError(null);
    setDone(false);
    withdraw.reset();
    onClose();
  }

  function submit() {
    if (!amountMinor) return setError("Enter a valid amount");
    if (amountMinor > wallet.available.amountMinor) {
      return setError("Amount exceeds your available balance");
    }
    setError(null);
    withdraw.mutate(
      {
        amountMinor,
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        idempotencyKey: crypto.randomUUID(),
      },
      {
        onSuccess: () => setDone(true),
        onError: (e) => setError(e.message),
      },
    );
  }

  return (
    <Dialog open={open} onClose={close} title="Withdraw funds">
      {done ? (
        <div className="space-y-4 text-center">
          <p className="font-semibold text-neutral-900">Withdrawal requested</p>
          <p className="text-sm text-neutral-500">
            {formatMoney({ amountMinor, currency: "INR" })} has been locked from your balance and
            is pending approval. You&apos;ll be notified once it&apos;s on its way to your bank.
          </p>
          <Button className="w-full" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
            Available to withdraw:{" "}
            <span className="font-semibold text-neutral-900">
              {formatMoney(wallet.available)}
            </span>
          </div>
          <Field label="Amount (₹)" htmlFor="w-amount">
            <Input
              id="w-amount"
              inputMode="decimal"
              placeholder="e.g. 10,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          {amountMinor > 0 ? (
            <p className="text-xs text-neutral-500">
              Platform fee ~{formatMoney({ amountMinor: feePreview, currency: "INR" })} · you
              receive ~{formatMoney({ amountMinor: amountMinor - feePreview, currency: "INR" })}
            </p>
          ) : null}
          <Field label="Account Holder Name" htmlFor="w-holder">
            <Input
              id="w-holder"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
          </Field>
          <Field label="Account Number" htmlFor="w-account">
            <Input
              id="w-account"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </Field>
          <Field label="IFSC Code" htmlFor="w-ifsc">
            <Input
              id="w-ifsc"
              placeholder="HDFC0001234"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value)}
            />
          </Field>
          {error ? (
            <p className="text-sm text-danger-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button className="w-full" size="lg" loading={withdraw.isPending} onClick={submit}>
            Request withdrawal
          </Button>
        </div>
      )}
    </Dialog>
  );
}
