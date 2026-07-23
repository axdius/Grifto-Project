"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLogout } from "@grifto/sdk";
import { Button, Drawer } from "@grifto/ui";
import { useSession } from "@/features/auth/hooks/use-session";
import { WalletChip } from "@/features/wallet/components/wallet-chip";
import { primaryNavItems } from "./nav-items";

const drawerLinkClasses =
  "block rounded-lg px-3 py-2.5 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900";

/** Hamburger + slide-out drawer for tablet/mobile. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useSession();
  const logout = useLogout();

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Drawer open={open} onClose={close} title="Menu">
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {primaryNavItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={close} className={drawerLinkClasses}>
              {item.label}
            </Link>
          ))}

          <div className="my-2 border-t border-neutral-100" />

          {isAuthenticated && user ? (
            <>
              <div className="px-3 py-2">
                <WalletChip onNavigate={close} />
              </div>
              <Link href="/dashboard" onClick={close} className={drawerLinkClasses}>
                {user.firstName}&rsquo;s Dashboard
              </Link>
              <Button
                variant="ghost"
                className="justify-start px-3 text-base"
                loading={logout.isPending}
                onClick={() =>
                  logout.mutate(undefined, {
                    onSettled: () => {
                      close();
                      router.push("/");
                    },
                  })
                }
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={close} className={drawerLinkClasses}>
                Login
              </Link>
              <div className="px-3 py-2">
                <Link href="/register" onClick={close}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            </>
          )}
        </nav>
      </Drawer>
    </div>
  );
}
