/*
  The session cookie contract, in one place.

  Deliberately free of `server-only` and of `next/headers`: `src/proxy.ts` needs
  the names too, and it runs before any React rendering. Anything that actually
  touches the cookie store lives in `session.ts`.
*/

/** The API's short-lived access token. Its presence means "probably signed in". */
export const ACCESS_TOKEN_COOKIE = "fc_at";

/** The API's opaque refresh token. Rotates on every use. */
export const REFRESH_TOKEN_COOKIE = "fc_rt";

export type SessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

/**
 * Attributes for both cookies.
 *
 * `httpOnly` keeps the tokens out of JavaScript, so a script injection cannot
 * read them. `sameSite: "lax"` rather than `"strict"`: strict would drop the
 * cookie on the first navigation in from an emailed invite link, which makes
 * acceptance fail in a way nobody can explain. No `domain`, so the cookie is
 * host-only and never reaches a sibling subdomain.
 */
export function sessionCookieOptions(expiresAt: string | Date): SessionCookieOptions {
  return {
    httpOnly: true,
    // Off in development so it works over plain http://localhost in every
    // browser, Safari included, with no local certificate.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds(expiresAt),
  };
}

/** Seconds until the token expires, never negative. */
export function maxAgeSeconds(expiresAt: string | Date): number {
  const expiry = new Date(expiresAt).getTime();

  if (Number.isNaN(expiry)) {
    return 0;
  }

  return Math.max(0, Math.floor((expiry - Date.now()) / 1000));
}
