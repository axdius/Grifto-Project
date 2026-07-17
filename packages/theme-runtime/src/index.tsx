import type { ReactNode } from "react";
import type { ThemeDocument, ThemeSection } from "@grifto/contracts";
import { sectionDefaults } from "@grifto/theme-schemas";

/**
 * JSON theme document → React renderer.
 * Used by BOTH the storefront homepage and the editor canvas preview, so what
 * you edit is exactly what ships (architecture doc 07).
 *
 * Sections needing external data (CMS testimonials/FAQs) read it from
 * ThemeRenderContext supplied by the host — the runtime performs no fetching.
 */

export interface ThemeRenderContext {
  testimonials?: { id: string; title: string; body: string }[];
  faqs?: { id: string; title: string; body: string }[];
  /** Host link component (Next's Link on web; plain anchor in the editor). */
  LinkComponent?: (props: { href: string; className?: string; children: ReactNode }) => ReactNode;
}

function getSetting<T>(section: ThemeSection, key: string): T {
  const defaults = sectionDefaults(section.type);
  return (section.settings[key] ?? defaults[key]) as T;
}

function HostLink({
  context,
  href,
  className,
  children,
}: {
  context: ThemeRenderContext;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const Link = context.LinkComponent;
  if (Link) return <Link href={href} className={className}>{children}</Link>;
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function HeroBanner({ section, context }: { section: ThemeSection; context: ThemeRenderContext }) {
  const heading = getSetting<string>(section, "heading");
  const highlight = getSetting<string>(section, "highlight");
  const subheading = getSetting<string>(section, "subheading");
  const ctaLabel = getSetting<string>(section, "ctaLabel");
  const ctaHref = getSetting<string>(section, "ctaHref");
  const secondaryLabel = getSetting<string>(section, "secondaryLabel");
  const secondaryHref = getSetting<string>(section, "secondaryHref");
  const background = getSetting<string>(section, "background");

  const parts = highlight && heading.includes(highlight) ? heading.split(highlight) : [heading];

  return (
    <section style={{ backgroundColor: background }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
        <h1 className="font-display max-w-3xl text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
          {parts.length === 2 ? (
            <>
              {parts[0]}
              <span className="text-brand-600">{highlight}</span>
              {parts[1]}
            </>
          ) : (
            heading
          )}
        </h1>
        <p className="max-w-xl text-lg text-neutral-600">{subheading}</p>
        <div className="flex gap-3">
          {ctaLabel ? (
            <HostLink
              context={context}
              href={ctaHref}
              className="inline-flex h-12 items-center rounded-lg bg-brand-600 px-6 text-base font-medium text-white hover:bg-brand-700"
            >
              {ctaLabel}
            </HostLink>
          ) : null}
          {secondaryLabel ? (
            <HostLink
              context={context}
              href={secondaryHref}
              className="inline-flex h-12 items-center rounded-lg border border-neutral-300 bg-white px-6 text-base font-medium text-neutral-800 hover:bg-neutral-50"
            >
              {secondaryLabel}
            </HostLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function RichText({ section }: { section: ThemeSection }) {
  const heading = getSetting<string>(section, "heading");
  const body = getSetting<string>(section, "body");
  const align = getSetting<string>(section, "align");
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className={align === "center" ? "text-center" : ""}>
        <h2 className="font-display text-3xl font-bold text-neutral-900">{heading}</h2>
        <p className="mt-4 whitespace-pre-line text-neutral-600">{body}</p>
      </div>
    </section>
  );
}

function Testimonials({
  section,
  context,
}: {
  section: ThemeSection;
  context: ThemeRenderContext;
}) {
  const heading = getSetting<string>(section, "heading");
  const maxItems = getSetting<number>(section, "maxItems");
  const showBackground = getSetting<boolean>(section, "showBackground");
  const items = (context.testimonials ?? []).slice(0, maxItems);

  return (
    <section className={showBackground ? "bg-neutral-50 py-16" : "py-16"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-center text-3xl font-bold text-neutral-900">{heading}</h2>
        {items.length === 0 ? (
          <p className="mt-8 text-center text-sm text-neutral-400">
            No published testimonials — add them in the CMS.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {items.map((t) => (
              <div key={t.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-neutral-600">&ldquo;{t.body}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold text-brand-700">{t.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FaqList({ section, context }: { section: ThemeSection; context: ThemeRenderContext }) {
  const heading = getSetting<string>(section, "heading");
  const maxItems = getSetting<number>(section, "maxItems");
  const items = (context.faqs ?? []).slice(0, maxItems);
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h2 className="font-display text-3xl font-bold text-neutral-900">{heading}</h2>
      <dl className="mt-8 space-y-4">
        {items.map((faq) => (
          <div key={faq.id} className="rounded-xl border border-neutral-200 bg-white p-5">
            <dt className="font-semibold text-neutral-900">{faq.title}</dt>
            <dd className="mt-2 text-sm text-neutral-600">{faq.body}</dd>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-center text-sm text-neutral-400">No published FAQs.</p>
        ) : null}
      </dl>
    </section>
  );
}

function CtaBanner({ section, context }: { section: ThemeSection; context: ThemeRenderContext }) {
  const heading = getSetting<string>(section, "heading");
  const ctaLabel = getSetting<string>(section, "ctaLabel");
  const ctaHref = getSetting<string>(section, "ctaHref");
  const background = getSetting<string>(section, "background");
  return (
    <section style={{ backgroundColor: background }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center sm:flex-row sm:justify-between sm:text-left">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{heading}</h2>
        <HostLink
          context={context}
          href={ctaHref}
          className="inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
        >
          {ctaLabel}
        </HostLink>
      </div>
    </section>
  );
}

function Spacer({ section }: { section: ThemeSection }) {
  const height = getSetting<number>(section, "height");
  return <div style={{ height }} aria-hidden />;
}

export function RenderSection({
  section,
  context = {},
}: {
  section: ThemeSection;
  context?: ThemeRenderContext;
}) {
  switch (section.type) {
    case "hero_banner":
      return <HeroBanner section={section} context={context} />;
    case "rich_text":
      return <RichText section={section} />;
    case "testimonials":
      return <Testimonials section={section} context={context} />;
    case "faq_list":
      return <FaqList section={section} context={context} />;
    case "cta_banner":
      return <CtaBanner section={section} context={context} />;
    case "spacer":
      return <Spacer section={section} />;
    default:
      return (
        <div className="mx-auto max-w-3xl px-4 py-8 text-center text-sm text-neutral-400">
          Unknown section type: {section.type}
        </div>
      );
  }
}

export function RenderThemeDocument({
  document,
  context = {},
}: {
  document: ThemeDocument;
  context?: ThemeRenderContext;
}) {
  return (
    <>
      {document.sections.map((section) => (
        <RenderSection key={section.id} section={section} context={context} />
      ))}
    </>
  );
}
