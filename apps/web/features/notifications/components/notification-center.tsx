"use client";

import { useMarkNotificationsRead, useNotifications } from "@grifto/sdk";
import { Button, EmptyState, Spinner, cn } from "@grifto/ui";
import { formatDateTime } from "@grifto/utils";

export function NotificationCenter() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Notifications</h1>
          {data && data.unreadCount > 0 ? (
            <p className="mt-1 text-sm text-neutral-500">{data.unreadCount} unread</p>
          ) : null}
        </div>
        {data && data.unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            loading={markRead.isPending}
            onClick={() => markRead.mutate({})}
          >
            Mark all as read
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Contributions, reservations and wallet updates will appear here."
        />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.readAt && markRead.mutate({ ids: [n.id] })}
              className={cn(
                "w-full rounded-card border px-4 py-3 text-left transition-colors",
                n.readAt
                  ? "border-neutral-200 bg-white"
                  : "border-brand-200 bg-brand-50/60 hover:bg-brand-50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-neutral-600">{n.body}</p>
                </div>
                {!n.readAt ? <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-500" /> : null}
              </div>
              <p className="mt-1 text-xs text-neutral-400">{formatDateTime(n.createdAt)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
