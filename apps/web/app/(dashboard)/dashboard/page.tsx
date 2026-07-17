"use client";

import Link from "next/link";
import { Button, Card, CardBody } from "@grifto/ui";
import { useSession } from "@/features/auth/hooks/use-session";

export default function DashboardOverviewPage() {
  const { user } = useSession();
  if (!user) return null;

  const weddingDate = new Date(user.weddingDate);
  const daysToGo = Math.max(
    0,
    Math.ceil((weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">
          Welcome, {user.firstName}!
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {daysToGo > 0
            ? `${daysToGo} days until your wedding on ${weddingDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.`
            : "Congratulations on your wedding!"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-neutral-900">My Wishlist</p>
            <p className="mt-1 text-sm text-neutral-500">
              Add gifts and share your list with guests.
            </p>
            <Link href="/dashboard/wishlist" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">
                Manage wishlist
              </Button>
            </Link>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-neutral-900">Wallet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Track contributions and withdraw funds (arrives in M6).
            </p>
            <Link href="/dashboard/wallet" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">
                View wallet
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
