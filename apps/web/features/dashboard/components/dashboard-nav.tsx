"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@grifto/ui";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/wishlist", label: "My Wishlist" },
  { href: "/dashboard/requests", label: "Address Requests" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/profile", label: "Profile" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden w-48 shrink-0 md:block" aria-label="Dashboard">
      <ul className="space-y-1">
        {items.map((item) => {
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium",
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
    </nav>
  );
}
