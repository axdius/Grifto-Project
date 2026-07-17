"use client";

import { useState } from "react";
import type { WithdrawalStatus } from "@grifto/contracts";
import { useAdminWithdrawals, useDecideWithdrawal } from "@grifto/sdk";
import { Badge, Button, cn } from "@grifto/ui";
import { formatDateTime, formatMoney } from "@grifto/utils";
import { PageHeader } from "@/components/admin-shell";
import { DataTable } from "@/components/data-table";

const tabs: { key: WithdrawalStatus | "all"; label: string }[] = [
  { key: "requested", label: "Pending approval" },
  { key: "approved", label: "Approved" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const statusTone = {
  requested: "warning",
  approved: "brand",
  processing: "brand",
  completed: "success",
  rejected: "danger",
} as const;

export function PayoutQueue() {
  const [tab, setTab] = useState<WithdrawalStatus | "all">("requested");
  const { data, isLoading } = useAdminWithdrawals(tab === "all" ? undefined : tab);
  const decide = useDecideWithdrawal();

  return (
    <>
      <PageHeader title="Payouts" />
      <div className="mb-4 flex gap-1 rounded-lg bg-neutral-100 p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              tab === t.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <DataTable
        loading={isLoading}
        rows={data?.items}
        emptyText="No payouts in this state"
        columns={[
          {
            key: "customer",
            header: "Customer",
            render: (w) => (
              <div>
                <p className="font-medium text-neutral-900">{w.customerName}</p>
                <p className="text-xs text-neutral-400">{w.customerEmail}</p>
              </div>
            ),
          },
          {
            key: "bank",
            header: "Bank",
            render: (w) => (
              <div>
                <p>{w.accountHolder}</p>
                <p className="text-xs text-neutral-400">
                  ····{w.bankAccountLast4} · {w.ifsc}
                </p>
              </div>
            ),
          },
          { key: "requested", header: "Requested", render: (w) => formatDateTime(w.createdAt) },
          {
            key: "amount",
            header: "Amount / Net",
            align: "right",
            render: (w) => (
              <div>
                <p className="font-semibold">{formatMoney(w.amount)}</p>
                <p className="text-xs text-neutral-400">
                  net {formatMoney(w.netAmount)} (fee {formatMoney(w.fee)})
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (w) => (
              <Badge tone={statusTone[w.status]} className="capitalize">
                {w.status}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (w) => {
              const busy = decide.isPending && decide.variables?.withdrawalId === w.id;
              if (w.status === "requested") {
                return (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      loading={busy}
                      onClick={() => decide.mutate({ withdrawalId: w.id, decision: "approved" })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => decide.mutate({ withdrawalId: w.id, decision: "rejected" })}
                    >
                      Reject
                    </Button>
                  </div>
                );
              }
              if (w.status === "approved") {
                return (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy}
                    onClick={() => decide.mutate({ withdrawalId: w.id, decision: "completed" })}
                  >
                    Mark paid
                  </Button>
                );
              }
              return null;
            },
          },
        ]}
      />
    </>
  );
}
