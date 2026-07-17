"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PlatformServices } from "./contracts";

const PlatformServicesContext = createContext<PlatformServices | null>(null);

export function PlatformServicesProvider({
  services,
  children,
}: {
  services: PlatformServices;
  children: ReactNode;
}) {
  return (
    <PlatformServicesContext.Provider value={services}>{children}</PlatformServicesContext.Provider>
  );
}

export function usePlatformServices(): PlatformServices {
  const services = useContext(PlatformServicesContext);
  if (!services) {
    throw new Error("usePlatformServices must be used within <PlatformServicesProvider>");
  }
  return services;
}

export function useStorageService() {
  return usePlatformServices().storage;
}

export function usePaymentCheckout() {
  return usePlatformServices().paymentCheckout;
}

export function useAnalytics() {
  return usePlatformServices().analytics;
}
