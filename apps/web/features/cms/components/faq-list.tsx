"use client";

import { usePublicCmsEntries } from "@grifto/sdk";
import { EmptyState, Spinner } from "@grifto/ui";

/** FAQ content served by the CMS — editable from the admin panel. */
export function FaqList() {
  const { data, isLoading } = usePublicCmsEntries("faq");

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return <EmptyState title="No FAQs yet" className="mt-8" />;
  }

  return (
    <dl className="mt-8 space-y-6">
      {items.map((faq) => (
        <div key={faq.id} className="rounded-card border border-neutral-200 bg-white p-5">
          <dt className="font-semibold text-neutral-900">{faq.title}</dt>
          <dd className="mt-2 text-sm text-neutral-600">{faq.body}</dd>
        </div>
      ))}
    </dl>
  );
}
