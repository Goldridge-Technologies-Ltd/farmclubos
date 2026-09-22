import "server-only";

import { cookies } from "next/headers";
import type { AuthSession, SessionContext } from "./api/contracts";
import { apiRequest } from "./api/client";
import { isUnauthorized } from "./api/errors";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
} from "./session-cookies";

/*
  The session, as this app holds it.

  The API is a stateless bearer service; the tokens live here, in httpOnly
  cookies on this app's own origin, and never reach the browser's JavaScript.

  Writing a cookie only works in a Server Action or a Route Handler — HTTP
  cannot set one once streaming has started. That is why signing in is an
  action and refreshing is a route, not something a page can do while it
  renders.
*/

export async function readAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function readRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}

/** Stores a freshly issued pair. Server Actions and Route Handlers only. */
export async function startSession(session: AuthSession): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    session.accessToken,
    sessionCookieOptions(session.accessTokenExpiresAt),
  );
  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    session.refreshToken,
    sessionCookieOptions(session.refreshTokenExpiresAt),
  );
}

/** Forgets the session here. Ending it on the API is a separate call. */
export async function endSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Who is signed in, from the API rather than from the token.
 *
 * The access token carries a role, but it is up to fifteen minutes old. A
 * membership suspended since it was issued must take effect now, so the
 * decision comes from the database each time.
 *
 * Returns null when there is no usable session; the caller redirects. It does
 * not refresh: a page cannot set a cookie, so `proxy.ts` sends the browser
 * through `/refresh` before the page renders.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  if (!(await readAccessToken())) {
    return null;
  }

  try {
    return await apiRequest<SessionContext>("/api/auth/me");
  } catch (error) {
    if (isUnauthorized(error)) {
      return null;
    }

    // A real failure — the API is down, the network is gone — is not the same
    // as being signed out, and must not silently look like it.
    throw error;
  }
}
