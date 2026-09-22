import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/session-cookies";

/*
  An optimistic gate, and nothing more.

  It reads cookie *presence* only: it never decodes a token, calls the API or
  touches the database. It runs on every request, prefetches included, so it
  has to be cheap — and it is not a security boundary. The API checks every
  request properly, and a page reads the session from the API before it
  renders anything worth protecting. All this does is save a signed-out person
  a pointless round trip, and send an expired session through /refresh.
*/

/** Reachable without a session; a signed-in person is sent away from them. */
const SIGNED_OUT_ROUTES = [
  "/sign-in",
  "/accept-invite",
  "/forgot-password",
  "/reset-password",
];

export default function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  // The refresh hop itself must never be gated: gating it would send a request
  // with an expired access token to /refresh?next=/refresh, forever.
  if (pathname === "/refresh") {
    return NextResponse.next();
  }

  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (SIGNED_OUT_ROUTES.some((route) => pathname.startsWith(route))) {
    /*
      An invitation is the exception: someone already signed in may be
      accepting one for a second institution, so they are left on the page.
    */
    return hasAccessToken && !pathname.startsWith("/accept-invite")
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (hasAccessToken) {
    return NextResponse.next();
  }

  // The access token has expired but the session has not: swap it for a new
  // pair and carry on to where they were going. A page cannot do this itself,
  // because only a Server Action or Route Handler may set a cookie.
  if (hasRefreshToken) {
    const refresh = new URL("/refresh", request.url);
    refresh.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(refresh);
  }

  const signIn = new URL("/sign-in", request.url);

  if (pathname !== "/") {
    signIn.searchParams.set("next", `${pathname}${search}`);
  }

  return NextResponse.redirect(signIn);
}

export const config = {
  // Everything except Next's own assets and the files in public/. Without this
  // the redirects would block stylesheets and images too.
  matcher: [
    "/((?!_next/static|_next/image|brand/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
