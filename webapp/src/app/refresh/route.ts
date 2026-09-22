import { NextResponse, type NextRequest } from "next/server";
import { apiRequest } from "@/lib/api/client";
import type { AuthSession } from "@/lib/api/contracts";
import {
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  safeRedirectPath,
  writeSessionCookies,
} from "@/lib/session-cookies";

/*
  Swaps an expired access token for a fresh pair, then continues to wherever
  the person was going.

  This exists as a route rather than something a page does, because HTTP
  cannot set a cookie once a response has started streaming: only a Server
  Action or a Route Handler may write one. `proxy.ts` sends the browser here
  when the access token has gone but the refresh token remains.

  The cookies are written onto this response rather than through `cookies()`,
  so they are attached to the redirect the browser actually follows.
*/
export async function GET(request: NextRequest): Promise<NextResponse> {
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    const session = await apiRequest<AuthSession>("/api/auth/refresh", {
      method: "POST",
      authenticated: false,
      body: { refreshToken },
    });

    const response = NextResponse.redirect(new URL(next, request.url));
    writeSessionCookies(response.cookies, session);

    return response;
  } catch {
    /*
      Expired, already used, or reported as stolen — the API has ended the
      session either way. Clear the cookies so the next request does not come
      straight back here, and ask them to sign in.
    */
    const response = NextResponse.redirect(new URL("/sign-in", request.url));
    clearSessionCookies(response.cookies);

    return response;
  }
}
