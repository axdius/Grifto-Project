import type { AnyEndpoint, InferOrUndefined } from "@grifto/contracts";
import type { z } from "zod";
import { toApiError } from "./errors";

export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: { accessToken: string; refreshToken: string; accessTokenExpiresAt: string }): void;
  clear(): void;
}

export interface ApiClientConfig {
  /** Base URL of the API. In mock mode this is same-origin (MSW intercepts). */
  baseUrl: string;
  tokenStore: TokenStore;
  /** Called when a 401 cannot be recovered by refresh — apps route to login. */
  onSessionExpired?: () => void;
}

export interface RequestOptions<E extends AnyEndpoint> {
  params?: InferOrUndefined<E["params"]>;
  query?: InferOrUndefined<E["query"]>;
  body?: InferOrUndefined<E["body"]>;
  signal?: AbortSignal;
}

export interface ApiClient {
  request<E extends AnyEndpoint>(
    endpoint: E,
    options?: RequestOptions<E>,
  ): Promise<z.infer<E["response"]>>;
  config: ApiClientConfig;
}

function buildUrl(baseUrl: string, endpoint: AnyEndpoint, options: RequestOptions<AnyEndpoint>): string {
  let path = endpoint.path;
  const params = options.params as Record<string, string> | undefined;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }
  const url = new URL(path, baseUrl);
  const query = options.query as Record<string, unknown> | undefined;
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Creates the typed API client. This is the ONLY place in the frontend that
 * performs HTTP. Today MSW intercepts these requests; later they hit NestJS.
 * A single-flight refresh lock mirrors the production token-rotation design.
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  let refreshInFlight: Promise<boolean> | null = null;

  async function tryRefresh(): Promise<boolean> {
    refreshInFlight ??= (async () => {
      const refreshToken = config.tokenStore.getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await fetch(new URL("/v1/auth/refresh", config.baseUrl).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const tokens = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
          accessTokenExpiresAt: string;
        };
        config.tokenStore.setTokens(tokens);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  }

  async function doFetch(endpoint: AnyEndpoint, options: RequestOptions<AnyEndpoint>): Promise<Response> {
    const headers: Record<string, string> = {};
    if (endpoint.body) headers["Content-Type"] = "application/json";
    if (endpoint.auth) {
      const token = config.tokenStore.getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(buildUrl(config.baseUrl, endpoint, options), {
      method: endpoint.method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  }

  return {
    config,
    async request(endpoint, options = {}) {
      let response = await doFetch(endpoint, options as RequestOptions<AnyEndpoint>);

      if (response.status === 401 && endpoint.auth) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          response = await doFetch(endpoint, options as RequestOptions<AnyEndpoint>);
        } else {
          config.tokenStore.clear();
          config.onSessionExpired?.();
        }
      }

      if (!response.ok) throw await toApiError(response);
      const data: unknown = await response.json();
      return endpoint.response.parse(data) as z.infer<typeof endpoint.response>;
    },
  };
}
