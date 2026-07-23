import Link from "next/link";
import { HeaderAuthActions } from "@/features/auth/components/header-auth-actions";
import { MobileNav } from "./mobile-nav";
import { brand, primaryNavItems } from "./nav-items";

/**
 * Global header per the scope PDF: logo left; FAQ, Contact, auth actions right.
 * Desktop shows the inline nav; tablet/mobile collapse it into a drawer.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={brand.homeHref} className="font-display text-2xl font-bold text-brand-700">
          {brand.name}
        </Link>

        <nav className="hidden items-center gap-1 md:flex lg:gap-2" aria-label="Main">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
          <HeaderAuthActions />
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
