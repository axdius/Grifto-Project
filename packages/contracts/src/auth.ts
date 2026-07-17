import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { isoDate, isoDateTime } from "./common";

export const userRoleTypeSchema = z.enum(["bride", "groom"]);
export type UserRoleType = z.infer<typeof userRoleTypeSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  roleType: userRoleTypeSchema,
  weddingDate: isoDate,
  createdAt: isoDateTime,
});
export type User = z.infer<typeof userSchema>;

/** Fields per the scope PDF's registration form. */
export const registerBodySchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  roleType: userRoleTypeSchema,
  weddingDate: isoDate,
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

/**
 * Token pair mirrors the production design (file 05 of the architecture docs):
 * short-lived access token + rotating refresh token. The mock issues fake but
 * correctly-shaped tokens with real expiries so the refresh flow is exercised now.
 */
export const authTokensSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: isoDateTime,
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const authSessionSchema = z.object({
  user: userSchema,
  tokens: authTokensSchema,
});
export type AuthSession = z.infer<typeof authSessionSchema>;

export const authEndpoints = {
  register: defineEndpoint({
    method: "POST",
    path: "/v1/auth/register",
    body: registerBodySchema,
    response: authSessionSchema,
  }),
  login: defineEndpoint({
    method: "POST",
    path: "/v1/auth/login",
    body: loginBodySchema,
    response: authSessionSchema,
  }),
  refresh: defineEndpoint({
    method: "POST",
    path: "/v1/auth/refresh",
    body: z.object({ refreshToken: z.string() }),
    response: authTokensSchema,
  }),
  logout: defineEndpoint({
    method: "POST",
    path: "/v1/auth/logout",
    auth: true,
    body: z.object({ refreshToken: z.string() }),
    response: z.object({ ok: z.literal(true) }),
  }),
  me: defineEndpoint({
    method: "GET",
    path: "/v1/auth/me",
    auth: true,
    response: userSchema,
  }),
} as const;
