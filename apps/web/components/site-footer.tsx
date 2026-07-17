import Link from "next/link";
import { NewsletterForm } from "@/features/cms/components/newsletter-form";

const quickLinks = [
  { href: "/about", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/contact", label: "Contact Us" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-100 bg-neutral-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-bold text-brand-700">Grifto</p>
          <p className="mt-2 max-w-xs text-sm text-neutral-500">
            The wedding gifting platform. Create your wishlist, share it with your guests, and
            receive gifts that truly matter.
          </p>
        </div>
        <nav aria-label="Quick links">
          <p className="text-sm font-semibold text-neutral-900">Quick Links</p>
          <ul className="mt-3 space-y-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Stay in the loop</p>
          <p className="mt-2 text-sm text-neutral-500">
            Subscribe to the Grifto newsletter for tips and updates.
          </p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-neutral-100 py-4 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Grifto. All rights reserved.
      </div>
    </footer>
  );
}
