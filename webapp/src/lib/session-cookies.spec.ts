import { jest } from "@jest/globals";
import { maxAgeSeconds, sessionCookieOptions } from "./session-cookies";

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
