import Link from "next/link";
import { HeaderAuthActions } from "@/features/auth/components/header-auth-actions";

/**
 * Global header per the scope PDF: logo left; FAQ, Contact, auth actions right.
 * Wallet/points chip appears for authenticated users (HeaderAuthActions).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-2xl font-bold text-brand-700">
          Grifto
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <Link
            href="/faq"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            Contact Us
          </Link>
          <HeaderAuthActions />
        </nav>
      </div>
    </header>
  );
}
