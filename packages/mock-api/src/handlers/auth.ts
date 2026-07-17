import { http } from "msw";
import {
  loginBodySchema,
  registerBodySchema,
  type AuthSession,
  type AuthTokens,
  type User,
} from "@grifto/contracts";
import { db, newId } from "../db/db";
import type { DbUser } from "../db/schema";
import {
  authenticate,
  issueAccessToken,
  issueRefreshToken,
  ok,
  problem,
  simulateLatency,
  unauthorized,
} from "../http";

function toUserDto(user: DbUser): User {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    roleType: user.roleType,
    weddingDate: user.weddingDate,
    createdAt: user.createdAt,
  };
}

function buildSession(user: DbUser): AuthSession {
  const access = issueAccessToken(user.id);
  return {
    user: toUserDto(user),
    tokens: {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: issueRefreshToken(user.id),
    },
  };
}

export const authHandlers = [
  http.post("*/v1/auth/register", async ({ request }) => {
    await simulateLatency();
    const parsed = registerBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    if (db.get().users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
      return problem(409, "AUTH_EMAIL_TAKEN", "Email already registered");
    }
    const user = db.mutate((data) => {
      const newUser: DbUser = {
        id: newId("usr"),
        email: body.email,
        phone: body.phone,
        passwordPlain: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        roleType: body.roleType,
        weddingDate: body.weddingDate,
        partnerName: null,
        weddingVenue: null,
        weddingMessage: null,
        createdAt: new Date().toISOString(),
      };
      data.users.push(newUser);
      data.wishlists.push({
        id: newId("wl"),
        userId: newUser.id,
        title: `${newUser.firstName}'s Wedding Wishlist`,
        shareSlug: `${newUser.firstName.toLowerCase()}-${newId("s").slice(2)}`,
        createdAt: new Date().toISOString(),
      });
      return newUser;
    });
    return ok(buildSession(user), 201);
  }),

  http.post("*/v1/auth/login", async ({ request }) => {
    await simulateLatency();
    const parsed = loginBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const user = db
      .get()
      .users.find(
        (u) =>
          u.email.toLowerCase() === parsed.data.email.toLowerCase() &&
          u.passwordPlain === parsed.data.password,
      );
    if (!user) {
      return problem(401, "AUTH_INVALID_CREDENTIALS", "Invalid email or password");
    }
    return ok(buildSession(user));
  }),

  http.post("*/v1/auth/refresh", async ({ request }) => {
    await simulateLatency();
    const body = (await request.json()) as { refreshToken?: string };
    const session = db.get().sessions.find((s) => s.refreshToken === body.refreshToken);
    if (!session) {
      return problem(401, "AUTH_REFRESH_INVALID", "Invalid refresh token");
    }
    // Rotate: consume old token, issue a new pair (mirrors production design).
    const tokens = db.mutate((data) => {
      data.sessions = data.sessions.filter((s) => s.refreshToken !== body.refreshToken);
      return null;
    });
    void tokens;
    const access = issueAccessToken(session.userId);
    const response: AuthTokens = {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: issueRefreshToken(session.userId),
    };
    return ok(response);
  }),

  http.post("*/v1/auth/logout", async ({ request }) => {
    await simulateLatency();
    const body = (await request.json()) as { refreshToken?: string };
    db.mutate((data) => {
      data.sessions = data.sessions.filter((s) => s.refreshToken !== body.refreshToken);
    });
    return ok({ ok: true });
  }),

  http.get("*/v1/auth/me", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    return ok(toUserDto(user));
  }),
];
