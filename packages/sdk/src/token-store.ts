import type { TokenStore } from "./client";

const STORAGE_KEY = "grifto.auth.tokens";

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

/**
 * Browser token store (localStorage-backed).
 *
 * Lives below the architectural boundary: app code never touches localStorage —
 * only this store does. When the real backend moves web auth to httpOnly
 * cookies (architecture doc 05), this store becomes a no-op cookie variant and
 * nothing above the client changes.
 */
export function createBrowserTokenStore(): TokenStore {
  let cache: StoredTokens | null = null;

  function read(): StoredTokens | null {
    if (cache) return cache;
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      cache = raw ? (JSON.parse(raw) as StoredTokens) : null;
    } catch {
      cache = null;
    }
    return cache;
  }

  return {
    getAccessToken: () => read()?.accessToken ?? null,
    getRefreshToken: () => read()?.refreshToken ?? null,
    setTokens(tokens) {
      cache = tokens;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      }
    },
    clear() {
      cache = null;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
  };
}

/** In-memory store for tests / SSR. */
export function createMemoryTokenStore(): TokenStore {
  let tokens: StoredTokens | null = null;
  return {
    getAccessToken: () => tokens?.accessToken ?? null,
    getRefreshToken: () => tokens?.refreshToken ?? null,
    setTokens(next) {
      tokens = next;
    },
    clear() {
      tokens = null;
    },
  };
}
