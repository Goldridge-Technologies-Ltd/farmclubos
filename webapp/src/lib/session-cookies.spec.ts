import { jest } from "@jest/globals";
import {
  ACCESS_TOKEN_COOKIE,
  maxAgeSeconds,
  safeRedirectPath,
  sessionCookieOptions,
  writeAccessTokenCookie,
} from "./session-cookies";

/*
  A wrong lifetime here is invisible: the session either dies on the next click
  or outlives the token it holds.
*/
describe("maxAgeSeconds", () => {
  const now = new Date("2026-09-22T10:00:00.000Z");

  beforeEach(() => {
    jest.useFakeTimers({ now, doNotFake: ["nextTick", "setImmediate"] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("counts the seconds left on the token", () => {
    expect(maxAgeSeconds("2026-09-22T10:15:00.000Z")).toBe(900);
  });

  it("floors a fraction, so the cookie never outlives the token", () => {
    expect(maxAgeSeconds("2026-09-22T10:00:09.900Z")).toBe(9);
  });

  it("clamps an already-expired token to zero rather than a negative age", () => {
    // A negative maxAge would make the browser drop the cookie immediately,
    // which is right — but Set-Cookie must not carry a negative number.
    expect(maxAgeSeconds("2026-09-22T09:00:00.000Z")).toBe(0);
  });

  it("treats an unparseable expiry as expired", () => {
    expect(maxAgeSeconds("not a date")).toBe(0);
  });
});

describe("sessionCookieOptions", () => {
  it("keeps the token out of JavaScript and off sibling subdomains", () => {
    const options = sessionCookieOptions(new Date(Date.now() + 60_000));

    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    // lax, not strict: strict drops the cookie on the first navigation in from
    // an emailed invite link.
    expect(options.sameSite).toBe("lax");
    expect(options).not.toHaveProperty("domain");
  });

  it("is insecure only outside production, so localhost works over http", () => {
    const original = process.env.NODE_ENV;

    try {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true });
      expect(sessionCookieOptions(new Date()).secure).toBe(true);

      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true });
      expect(sessionCookieOptions(new Date()).secure).toBe(false);
    } finally {
      Object.defineProperty(process.env, "NODE_ENV", { value: original, configurable: true });
    }
  });
});

/*
  Switching institution replaces the access token alone. Touching the refresh
  cookie there would sign the person out at the next refresh, fifteen minutes
  later, with nothing to connect it to what they did.
*/
describe("writeAccessTokenCookie", () => {
  it("writes the access token and leaves the refresh token alone", () => {
    const set = jest.fn();
    const expiresAt = new Date(Date.now() + 900_000).toISOString();

    writeAccessTokenCookie({ set }, "new-access-token", expiresAt);

    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      "new-access-token",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
  });
});

/*
  An open redirect: sign-in carries ?next= straight into redirect(), so a
  crafted link could otherwise bounce someone onto another site the moment
  they authenticate, with the sign-in page looking entirely genuine.
*/
describe("safeRedirectPath", () => {
  it("keeps an ordinary path, query and all", () => {
    expect(safeRedirectPath("/academy?pathway=greenhouse-enterprise")).toBe(
      "/academy?pathway=greenhouse-enterprise",
    );
  });

  // Protocol-relative, absolute, a lookalike host, a script URL, and nothing.
  const hostile: Array<string | null | undefined> = [
    "//evil.example.com",
    "https://evil.example.com",
    "http://localhost:3001.evil.example.com",
    "javascript:alert(1)",
    "",
    null,
    undefined,
  ];

  it.each(hostile)("refuses %p and falls back to the default", (value) => {
    expect(safeRedirectPath(value)).toBe("/");
  });

  it("uses the fallback it is given", () => {
    expect(safeRedirectPath("https://evil.example.com", "/sign-in")).toBe("/sign-in");
  });
});
