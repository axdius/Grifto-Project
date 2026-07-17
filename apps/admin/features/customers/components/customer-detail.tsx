"use client";

import { useAdminCustomer } from "@grifto/sdk";
import { Badge, Card, CardBody, CardHeader, CardTitle, Progress, Spinner } from "@grifto/ui";
import { formatDate, formatDateTime, formatMoney } from "@grifto/utils";
import { PageHeader } from "@/components/admin-shell";

/** Customer 360: profile, wishlist, contributions, withdrawals in one view. */
export function CustomerDetail({ customerId }: { customerId: string }) {
  const { data, isLoading } = useAdminCustomer(customerId);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }
  if (!data) return <p className="text-sm text-neutral-500">Customer not found.</p>;

  const { customer } = data;

  return (
    <>
      <PageHeader
        title={customer.name}
        actions={
          <Badge tone="brand" className="capitalize">
            {customer.roleType}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardBody>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Email</dt>
                <dd className="font-medium">{customer.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Phone</dt>
                <dd className="font-medium">{customer.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Wedding</dt>
                <dd className="font-medium">{formatDate(customer.weddingDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Joined</dt>
                <dd className="font-medium">{formatDate(customer.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Wallet available</dt>
                <dd className="font-semibold text-success-700">
                  {formatMoney(customer.walletAvailable)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Total received</dt>
                <dd className="font-medium">{formatMoney(customer.totalReceived)}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Wishlist ({data.wishlistItems.length})</CardTitle>
          </CardHeader>
          <CardBody>
            {data.wishlistItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-500">No items.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {data.wishlistItems.map((item) => (
                  <div key={item.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                      <p className="text-sm text-neutral-500">
                        {formatMoney(item.funded)} / {formatMoney(item.price)}
                      </p>
                    </div>
                    <Progress className="mt-2" value={item.progressPercent} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contributions ({data.contributions.length})</CardTitle>
          </CardHeader>
          <CardBody>
            {data.contributions.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-500">No contributions.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {data.contributions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-sm text-neutral-900">
                        <span className="font-medium">{c.guestName}</span> → {c.itemTitle}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDateTime(c.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatMoney(c.amount)}</span>
                      <Badge tone={c.status === "paid" ? "success" : c.status === "pending" ? "warning" : "danger"}>
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawals ({data.withdrawals.length})</CardTitle>
          </CardHeader>
          <CardBody>
            {data.withdrawals.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-500">No withdrawals.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {data.withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {formatMoney(w.amount)} → ····{w.bankAccountLast4}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDateTime(w.createdAt)}</p>
                    </div>
                    <Badge
                      tone={
                        w.status === "completed"
                          ? "success"
                          : w.status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                      className="capitalize"
                    >
                      {w.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
