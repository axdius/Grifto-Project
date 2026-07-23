/**
 * App configuration — the single switch between mock and real backends.
 *
 * mock: SDK hits the shared mock API (default http://localhost:4000).
 * real: SDK requests hit NEXT_PUBLIC_API_URL (the future NestJS API).
 */
export type ApiMode = "mock" | "real";

export const env = {
  apiMode: (process.env.NEXT_PUBLIC_API_MODE ?? "mock") as ApiMode,
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
} as const;
