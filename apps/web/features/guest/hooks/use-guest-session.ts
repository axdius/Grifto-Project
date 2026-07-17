"use client";

import { useCallback, useEffect, useState } from "react";
import type { GuestSession } from "@grifto/contracts";
import { usePlatformServices } from "@grifto/platform-services";

const KEY = "guest.session";

/**
 * Guest identity persistence (name + email gate per the PDF).
 * Backed by the KeyValueStore platform service — no direct localStorage in UI.
 */
export function useGuestSession() {
  const { kv } = usePlatformServices();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(kv.get<GuestSession>(KEY));
    setHydrated(true);
  }, [kv]);

  const save = useCallback(
    (next: GuestSession) => {
      kv.set(KEY, next);
      setSession(next);
    },
    [kv],
  );

  const clear = useCallback(() => {
    kv.remove(KEY);
    setSession(null);
  }, [kv]);

  return { session, hydrated, save, clear };
}
