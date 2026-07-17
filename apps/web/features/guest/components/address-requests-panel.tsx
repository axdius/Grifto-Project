"use client";

import { useAddressRequests, useDecideAddressRequest } from "@grifto/sdk";
import { Badge, Button, Card, CardBody, EmptyState, Spinner } from "@grifto/ui";
import { formatDateTime } from "@grifto/utils";

const statusTone = { pending: "warning", approved: "success", rejected: "danger" } as const;

/** Couple-side approval queue for guest delivery-address requests (PDF flow). */
export function AddressRequestsPanel() {
  const { data, isLoading } = useAddressRequests();
  const decide = useDecideAddressRequest();

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="No address requests"
        description="When a guest asks for your delivery address to send a gift, it will appear here for your approval."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((req) => (
        <Card key={req.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900">
                  {req.guestName}{" "}
                  <span className="font-normal text-neutral-500">wants to send</span>{" "}
                  {req.itemTitle}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {req.guestEmail} · {formatDateTime(req.createdAt)}
                </p>
                {req.message ? (
                  <p className="mt-2 rounded-lg bg-neutral-50 p-2 text-sm italic text-neutral-600">
                    &ldquo;{req.message}&rdquo;
                  </p>
                ) : null}
              </div>
              <Badge tone={statusTone[req.status]} className="capitalize">
                {req.status}
              </Badge>
            </div>
            {req.status === "pending" ? (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  loading={decide.isPending && decide.variables?.requestId === req.id}
                  onClick={() => decide.mutate({ requestId: req.id, decision: "approved" })}
                >
                  Share my address
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ requestId: req.id, decision: "rejected" })}
                >
                  Decline
                </Button>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
