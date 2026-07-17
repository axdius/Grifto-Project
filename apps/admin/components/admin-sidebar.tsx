"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@grifto/ui";

/**
 * Admin navigation — Shopify-style IA per architecture doc 10.
 * Sections marked with a milestone land later; the routes exist as stubs so
 * the IA is visible and navigable from day one.
 */
const navSections: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Home" }],
  },
  {
    label: "Commerce",
    items: [
      { href: "/customers", label: "Customers" },
      { href: "/products", label: "Products" },
      { href: "/contributions", label: "Contributions" },
      { href: "/payouts", label: "Payouts" },
      { href: "/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Online Store",
    items: [
      { href: "/theme", label: "Theme Editor" },
      { href: "/cms", label: "Content" },
      { href: "/media", label: "Media Library" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/settings", label: "Settings" },
      { href: "/logs", label: "Audit Logs" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-14 items-center border-b border-neutral-100 px-4">
        <Link href="/" className="font-display text-xl font-bold text-brand-700">
          Grifto <span className="text-xs font-sans font-medium text-neutral-400">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-3" aria-label="Admin">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-lg px-2 py-1.5 text-sm font-medium",
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
