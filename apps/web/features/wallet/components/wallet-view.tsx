"use client";

import { useState } from "react";
import type { WithdrawalStatus } from "@grifto/contracts";
import { useWallet, useWalletTransactions, useWithdrawals } from "@grifto/sdk";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Spinner } from "@grifto/ui";
import { formatDateTime, formatMoney } from "@grifto/utils";
import { WithdrawDialog } from "./withdraw-dialog";

const withdrawalTone: Record<
  WithdrawalStatus,
  "neutral" | "brand" | "success" | "warning" | "danger"
> = {
  requested: "warning",
  approved: "brand",
  processing: "brand",
  completed: "success",
  rejected: "danger",
};

const withdrawalLabel: Record<WithdrawalStatus, string> = {
  requested: "Pending approval",
  approved: "Approved",
  processing: "Processing",
  completed: "Completed",
  rejected: "Rejected",
};

export function WalletView() {
  const wallet = useWallet();
  const transactions = useWalletTransactions();
  const withdrawals = useWithdrawals();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  if (wallet.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }
  if (!wallet.data) {
    return <EmptyState title="Couldn't load your wallet" description={wallet.error?.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-neutral-900">Wallet</h1>
        <Button
          onClick={() => setWithdrawOpen(true)}
          disabled={wallet.data.available.amountMinor === 0}
        >
          Withdraw funds
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-neutral-500">Available</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">
              {formatMoney(wallet.data.available)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-neutral-500">Locked in withdrawals</p>
            <p className="mt-1 text-2xl font-semibold text-warning-700">
              {formatMoney(wallet.data.locked)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-neutral-500">Total gifts received</p>
            <p className="mt-1 text-2xl font-semibold text-success-700">
              {formatMoney(wallet.data.totalReceived)}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawals</CardTitle>
        </CardHeader>
        <CardBody>
          {(withdrawals.data?.items.length ?? 0) === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-500">No withdrawals yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {withdrawals.data?.items.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatMoney(w.amount)} → ····{w.bankAccountLast4}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {formatDateTime(w.createdAt)} · fee {formatMoney(w.fee)} · net{" "}
                      {formatMoney(w.netAmount)}
                    </p>
                  </div>
                  <Badge tone={withdrawalTone[w.status]}>{withdrawalLabel[w.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
        </CardHeader>
        <CardBody>
          {(transactions.data?.items.length ?? 0) === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-500">No transactions yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {transactions.data?.items.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm text-neutral-900">{t.description}</p>
                    <p className="text-xs text-neutral-400">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <p
                    className={
                      t.direction === "credit"
                        ? "text-sm font-semibold text-success-700"
                        : "text-sm font-semibold text-neutral-900"
                    }
                  >
                    {t.direction === "credit" ? "+" : "−"}
                    {formatMoney(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <WithdrawDialog
        wallet={wallet.data}
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />
    </div>
  );
}
