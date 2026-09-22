import "server-only";

import { headers } from "next/headers";

/**
 * The client's address as the platform forwarded it to this app, if at all.
 *
 * Passed on to the API so a sign-in attempt can be throttled against the
 * caller as well as the account. There is nothing to forward in development,
 * and the API keys on the account alone in that case — which is the right
 * behaviour anyway, since the address it would otherwise see is this app's.
 *
 * Read only where it is needed: `headers()` is a request-time API, and calling
 * it turns a route dynamic, which would quietly defeat caching on public reads.
 */
export async function forwardedClientAddress(): Promise<string | undefined> {
  const forwarded = (await headers()).get("x-forwarded-for");

  return forwarded?.split(",")[0]?.trim() || undefined;
}
