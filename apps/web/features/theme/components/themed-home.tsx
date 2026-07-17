"use client";

import Link from "next/link";
import { usePublicCmsEntries, usePublishedTheme } from "@grifto/sdk";
import { RenderThemeDocument, type ThemeRenderContext } from "@grifto/theme-runtime";
import { Spinner } from "@grifto/ui";

/**
 * Homepage rendered from the published theme document (M9). The admin theme
 * editor edits a draft of this same document; publishing makes it live here.
 */
export function ThemedHome() {
  const theme = usePublishedTheme();
  const testimonials = usePublicCmsEntries("testimonial");
  const faqs = usePublicCmsEntries("faq");

  if (theme.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6 text-brand-600" />
      </div>
    );
  }

  if (theme.isError || !theme.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-neutral-500">
        We couldn&apos;t load the homepage. Please refresh.
      </div>
    );
  }

  const context: ThemeRenderContext = {
    testimonials: (testimonials.data?.items ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      body: t.body,
    })),
    faqs: (faqs.data?.items ?? []).map((f) => ({ id: f.id, title: f.title, body: f.body })),
    LinkComponent: ({ href, className, children }) => (
      <Link href={href} className={className}>
        {children}
      </Link>
    ),
  };

  return <RenderThemeDocument document={theme.data} context={context} />;
}
