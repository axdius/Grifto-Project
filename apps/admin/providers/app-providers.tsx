"use client";

import { useMemo, type ReactNode } from "react";
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
 *
 * Mock mode talks to the shared @grifto/mock-api HTTP server so web and admin
 * share one DB. Browser MSW remains available via @grifto/mock-api/browser for
 * optional same-origin setups, but is not started here.
 */
export function AppProviders({ children }: { children: ReactNode }) {
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
        baseUrl: env.apiUrl,
        tokenStore: createBrowserTokenStore(),
      }),
    [],
  );

  const services = useMemo(() => createLocalPlatformServices(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider client={apiClient}>
        <PlatformServicesProvider services={services}>{children}</PlatformServicesProvider>
      </ApiClientProvider>
    </QueryClientProvider>
  );
}
