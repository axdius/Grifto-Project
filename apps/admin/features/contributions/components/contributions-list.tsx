"use client";

import { useAdminContributions } from "@grifto/sdk";
import { Badge } from "@grifto/ui";
import { formatDateTime, formatMoney } from "@grifto/utils";
import { PageHeader } from "@/components/admin-shell";
import { DataTable } from "@/components/data-table";

export function ContributionsList() {
  const { data, isLoading } = useAdminContributions();

  return (
    <>
      <PageHeader title="Contributions" />
      <DataTable
        loading={isLoading}
        rows={data?.items}
        emptyText="No contributions yet"
        columns={[
          {
            key: "guest",
            header: "Guest",
            render: (c) => (
              <div>
                <p className="font-medium text-neutral-900">{c.guestName}</p>
                <p className="text-xs text-neutral-400">{c.guestEmail}</p>
              </div>
            ),
          },
          { key: "item", header: "Gift", render: (c) => c.itemTitle },
          { key: "customer", header: "Customer", render: (c) => c.customerName },
          { key: "date", header: "Date", render: (c) => formatDateTime(c.createdAt) },
          {
            key: "amount",
            header: "Amount",
            align: "right",
            render: (c) => <span className="font-semibold">{formatMoney(c.amount)}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (c) => (
              <Badge
                tone={c.status === "paid" ? "success" : c.status === "pending" ? "warning" : "danger"}
              >
                {c.status}
              </Badge>
            ),
          },
        ]}
      />
    </>
  );
}
