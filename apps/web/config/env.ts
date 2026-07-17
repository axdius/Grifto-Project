/**
 * App configuration — the single switch between mock and real backends.
 *
 * mock: MSW intercepts SDK requests in the browser (Phase 1 default).
 * real: SDK requests hit NEXT_PUBLIC_API_URL (the future NestJS API).
 */
export type ApiMode = "mock" | "real";

export const env = {
  apiMode: (process.env.NEXT_PUBLIC_API_MODE ?? "mock") as ApiMode,
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
} as const;
