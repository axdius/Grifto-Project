"use client";

import { useAdminContributions, useAdminMetrics } from "@grifto/sdk";
import { Badge, Card, CardBody, CardHeader, CardTitle, Spinner } from "@grifto/ui";
import { formatDateTime, formatMoney } from "@grifto/utils";
import { PageHeader } from "@/components/admin-shell";

export function AdminHome() {
  const metrics = useAdminMetrics();
  const contributions = useAdminContributions();

  if (metrics.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }

  const m = metrics.data;
  const kpis = m
    ? [
        { label: "Total Contributions", value: formatMoney(m.totalContributions) },
        { label: "Wallet Balances (liability)", value: formatMoney(m.walletBalances) },
        { label: "Active Weddings", value: String(m.activeWeddings) },
        { label: "Pending Payouts", value: String(m.pendingPayouts) },
        { label: "Customers", value: String(m.totalCustomers) },
        { label: "Guests Engaged", value: String(m.totalGuests) },
      ]
    : [];

  return (
    <>
      <PageHeader title="Home" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardBody>
              <p className="text-sm text-neutral-500">{kpi.label}</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900">{kpi.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent contributions</CardTitle>
        </CardHeader>
        <CardBody>
          {(contributions.data?.items.length ?? 0) === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-500">No contributions yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {contributions.data?.items.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-neutral-900">
                      <span className="font-medium">{c.guestName}</span> → {c.itemTitle}{" "}
                      <span className="text-neutral-400">({c.customerName})</span>
                    </p>
                    <p className="text-xs text-neutral-400">{formatDateTime(c.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatMoney(c.amount)}
                    </span>
                    <Badge
                      tone={
                        c.status === "paid" ? "success" : c.status === "pending" ? "warning" : "danger"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
