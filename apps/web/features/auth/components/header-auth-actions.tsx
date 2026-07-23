"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLogout } from "@grifto/sdk";
import { Button } from "@grifto/ui";
import { WalletChip } from "@/features/wallet/components/wallet-chip";
import { useSession } from "../hooks/use-session";

/**
 * Auth-aware header slot per the scope PDF:
 * guests see Sign Up / Login; authenticated users see the Wallet chip + account actions.
 */
export function HeaderAuthActions() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useSession();
  const logout = useLogout();

  if (isLoading) {
    return <div className="ml-2 h-8 w-24 animate-pulse rounded-lg bg-neutral-100" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="ml-2 flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
        >
          Login
        </Link>
        <Link href="/register">
          <Button size="sm">Sign Up</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-2 flex items-center gap-2">
      <WalletChip />
      <Link
        href="/dashboard"
        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      >
        {user.firstName}
      </Link>
      <Button
        size="sm"
        variant="ghost"
        loading={logout.isPending}
        onClick={() =>
          logout.mutate(undefined, {
            onSettled: () => router.push("/"),
          })
        }
      >
        Logout
      </Button>
    </div>
  );
}
