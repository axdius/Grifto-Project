"use client";

import Link from "next/link";
import { useWallet } from "@grifto/sdk";
import { cn } from "@grifto/ui";
import { formatMoney } from "@grifto/utils";

/**
 * Header chip showing the user's withdrawable balance. Only render this for
 * authenticated users (the wallet endpoint requires a session).
 */
export function WalletChip({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const wallet = useWallet();

  return (
    <Link
      href="/dashboard/wallet"
      onClick={onNavigate}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1.5 text-sm font-medium text-gold-700 hover:bg-gold-300/50",
        className,
      )}
    >
      <span>Wallet</span>
      {wallet.data ? (
        <span className="font-semibold">{formatMoney(wallet.data.available)}</span>
      ) : (
        <span className="inline-block h-4 w-12 animate-pulse rounded bg-gold-300/50" />
      )}
    </Link>
  );
}
