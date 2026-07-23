"use client";

import { useMe } from "@grifto/sdk";

/**
 * Session facade — components consume this, never token internals.
 * Works identically against mock and real backends.
 */
export function useSession() {
  const { data: user, isLoading, isError } = useMe();
  return {
    user: user ?? null,
    isLoading,
    isError,
    isAuthenticated: Boolean(user) && !isError,
  };
}
