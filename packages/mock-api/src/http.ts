import { HttpResponse, delay } from "msw";
import type { Problem } from "@grifto/contracts";
import { db, newId } from "./db/db";
import type { DbUser } from "./db/schema";

/** Runtime-tunable mock behavior (exposed on window for dev tooling later). */
export const mockConfig = {
  latency: { min: 150, max: 500 },
  /** Set to a code like "PAYMENT_FAILED" to force the next matching handler to fail. */
  forceErrorCode: null as string | null,
};

export async function simulateLatency(): Promise<void> {
  const { min, max } = mockConfig.latency;
  await delay(min + Math.random() * (max - min));
}

export function problem(status: number, code: string, title: string, detail?: string) {
  const body: Problem = { type: "about:blank", title, status, code, detail, traceId: newId("trc") };
  return HttpResponse.json(body, { status });
}

export function ok<T>(body: T, status = 200) {
  return HttpResponse.json(body as Record<string, unknown>, { status });
}

// --- Mock token scheme -------------------------------------------------------
// access token:  "mock_at.<userId>.<expiresAtMs>"  — self-describing, expiry-checked
// refresh token: opaque id stored in db.sessions   — rotated on every refresh
// This exercises the real client's 401→refresh→retry path locally.

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

export function issueAccessToken(userId: string): { token: string; expiresAt: string } {
  const expiresAtMs = Date.now() + ACCESS_TOKEN_TTL_MS;
  return {
    token: `mock_at.${userId}.${expiresAtMs}`,
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

export function issueRefreshToken(userId: string): string {
  const token = newId("mock_rt");
  db.mutate((data) => {
    data.sessions.push({ refreshToken: token, userId, createdAt: new Date().toISOString() });
  });
  return token;
}

/** Returns the authenticated user or null (expired/missing/invalid token → null). */
export function authenticate(request: Request): DbUser | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer mock_at.")) return null;
  const [, userId, expiresAtMs] = header.replace("Bearer ", "").split(".");
  if (!userId || !expiresAtMs || Number(expiresAtMs) < Date.now()) return null;
  return db.get().users.find((u) => u.id === userId) ?? null;
}

export function unauthorized() {
  return problem(401, "AUTH_UNAUTHORIZED", "Unauthorized", "Missing or expired access token.");
}
