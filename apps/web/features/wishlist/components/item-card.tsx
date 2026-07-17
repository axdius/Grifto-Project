"use client";

import type { WishlistItem } from "@grifto/contracts";
import { Badge, Button, Card, CardBody, Progress } from "@grifto/ui";
import { formatMoney } from "@grifto/utils";

const statusMeta: Record<
  WishlistItem["status"],
  { label: string; tone: "neutral" | "brand" | "success" | "gold" }
> = {
  open: { label: "Open", tone: "neutral" },
  partially_funded: { label: "Partially Funded", tone: "brand" },
  fully_funded: { label: "Fully Funded", tone: "success" },
  reserved: { label: "Gift Booked", tone: "gold" },
};

export function ItemCard({
  item,
  onDelete,
  deleting,
}: {
  item: WishlistItem;
  onDelete?: (itemId: string) => void;
  deleting?: boolean;
}) {
  const meta = statusMeta[item.status];
  const done = item.status === "fully_funded" || item.status === "reserved";

  return (
    <Card>
      <CardBody className="flex gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-brand-300">
          {item.image ? (
            /* plain <img>: sources are object URLs / external product images */
            <img src={item.image.url} alt={item.image.alt} className="size-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-8">
              <path d="M12 2a4 4 0 014 4v1h3a1 1 0 011 1v3h-1a2 2 0 100 4h1v5a2 2 0 01-2 2h-5v-1a2 2 0 10-4 0v1H4a2 2 0 01-2-2v-5h1a2 2 0 100-4H2V8a1 1 0 011-1h3V6a4 4 0 014-4h2z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-900">{item.title}</p>
              <p className="text-sm text-neutral-500">{formatMoney(item.price)}</p>
            </div>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <div className="mt-3">
            <Progress value={item.progressPercent} tone={done ? "success" : "brand"} />
            <div className="mt-1.5 flex justify-between text-xs text-neutral-500">
              <span>
                {formatMoney(item.funded)} funded ({item.progressPercent}%)
              </span>
              {item.remaining.amountMinor > 0 && item.status !== "reserved" ? (
                <span>{formatMoney(item.remaining)} to go</span>
              ) : null}
            </div>
          </div>
        </div>
        {onDelete ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Remove ${item.title}`}
            loading={deleting}
            onClick={() => onDelete(item.id)}
            className="self-start text-neutral-400 hover:text-danger-600"
          >
            Remove
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}
