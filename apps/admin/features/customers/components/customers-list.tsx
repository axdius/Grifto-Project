"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminCustomers } from "@grifto/sdk";
import { Badge, Input } from "@grifto/ui";
import { formatDate, formatMoney } from "@grifto/utils";
import { PageHeader } from "@/components/admin-shell";
import { DataTable } from "@/components/data-table";

export function CustomersList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminCustomers(search);

  return (
    <>
      <PageHeader title="Customers" />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search customers"
        />
      </div>
      <DataTable
        loading={isLoading}
        rows={data?.items}
        emptyText="No customers found"
        onRowClick={(c) => router.push(`/customers/${c.id}`)}
        columns={[
          {
            key: "name",
            header: "Customer",
            render: (c) => (
              <div>
                <p className="font-medium text-neutral-900">{c.name}</p>
                <p className="text-xs text-neutral-400">{c.email}</p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (c) => (
              <Badge tone="brand" className="capitalize">
                {c.roleType}
              </Badge>
            ),
          },
          { key: "wedding", header: "Wedding Date", render: (c) => formatDate(c.weddingDate) },
          { key: "items", header: "Items", render: (c) => c.itemCount },
          {
            key: "received",
            header: "Total Received",
            align: "right",
            render: (c) => formatMoney(c.totalReceived),
          },
          {
            key: "wallet",
            header: "Wallet",
            align: "right",
            render: (c) => formatMoney(c.walletAvailable),
          },
        ]}
      />
    </>
  );
}
