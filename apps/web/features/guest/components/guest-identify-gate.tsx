"use client";

import { useState } from "react";
import type { GuestSession } from "@grifto/contracts";
import { useIdentifyGuest } from "@grifto/sdk";
import { Button, Field, Input } from "@grifto/ui";

/**
 * PDF requirement: before viewing the wishlist, guests share their full name
 * and email so the couple knows who engaged. No password, no account.
 */
export function GuestIdentifyGate({
  shareSlug,
  coupleNames,
  onIdentified,
}: {
  shareSlug: string;
  coupleNames: string;
  onIdentified: (session: GuestSession) => void;
}) {
  const identify = useIdentifyGuest();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!fullName.trim()) return setError("Please tell us your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address");
    setError(null);
    identify.mutate(
      { shareSlug, fullName: fullName.trim(), email: email.trim() },
      {
        onSuccess: onIdentified,
        onError: (e) => setError(e.message),
      },
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-card border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          You&apos;re invited
        </p>
        <h1 className="font-display mt-2 text-2xl font-bold text-neutral-900">
          {coupleNames}&apos;s Wedding Wishlist
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Let the couple know who&apos;s visiting — just your name and email.
        </p>
        <div className="mt-6 space-y-4 text-left">
          <Field label="Full Name" htmlFor="g-name">
            <Input id="g-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Email Address" htmlFor="g-email">
            <Input
              id="g-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {error ? (
            <p className="text-sm text-danger-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button className="w-full" size="lg" loading={identify.isPending} onClick={submit}>
            View the wishlist
          </Button>
        </div>
      </div>
    </div>
  );
}
