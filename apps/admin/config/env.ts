export type ApiMode = "mock" | "real";

export const env = {
  apiMode: (process.env.NEXT_PUBLIC_API_MODE ?? "mock") as ApiMode,
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
} as const;
