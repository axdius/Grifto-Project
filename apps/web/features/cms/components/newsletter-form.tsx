"use client";

import { useState, type FormEvent } from "react";
import { Button, Input } from "@grifto/ui";

/**
 * Newsletter subscription (PDF footer requirement). Client-side validation now;
 * wired to a CMS forms endpoint in M8 — the component's shape won't change.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      setState("error");
      return;
    }
    setState("done");
    setEmail("");
  }

  if (state === "done") {
    return <p className="mt-3 text-sm font-medium text-success-700">Thanks for subscribing!</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-3" noValidate>
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setState("idle");
          }}
          placeholder="you@example.com"
          aria-label="Email address"
          aria-invalid={state === "error"}
        />
        <Button type="submit" variant="secondary">
          Subscribe
        </Button>
      </div>
      {state === "error" ? (
        <p className="mt-1 text-sm text-danger-600" role="alert">
          Enter a valid email address
        </p>
      ) : null}
    </form>
  );
}
