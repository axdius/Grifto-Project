"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiClientProvider, createApiClient, createBrowserTokenStore } from "@grifto/sdk";
import {
  PlatformServicesProvider,
  createLocalPlatformServices,
} from "@grifto/platform-services";
import { env } from "@/config/env";

/**
 * Composition root. This is the ONLY file that knows whether the app runs
 * against mocks or a real API. Everything below consumes contexts.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [mockReady, setMockReady] = useState(env.apiMode !== "mock");

  useEffect(() => {
    if (env.apiMode === "mock") {
      // Dynamic import keeps mock code out of real-mode bundles entirely.
      void import("@grifto/mock-api/browser").then(({ startMockWorker }) =>
        startMockWorker().then(() => setMockReady(true)),
      );
    }
  }, []);

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
    [],
  );

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl:
          env.apiMode === "mock" && typeof window !== "undefined"
            ? window.location.origin
            : env.apiUrl,
        tokenStore: createBrowserTokenStore(),
      }),
    [],
  );

  const services = useMemo(() => createLocalPlatformServices(), []);

  // Hold rendering until MSW is intercepting, so no request escapes to the network.
  if (!mockReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider client={apiClient}>
        <PlatformServicesProvider services={services}>{children}</PlatformServicesProvider>
      </ApiClientProvider>
    </QueryClientProvider>
  );
}
