import { jest } from "@jest/globals";
import { apiPage, apiRequest } from "./client";
import { ApiError, validationMessages } from "./errors";

/*
  The envelope is unwrapped in exactly one place, so this is where a change to
  the API's reply shape shows up. A bearer token reaching a cached response, or
  an error losing its code, would both look fine on screen.
*/

type FetchArgs = [string, RequestInit];

const originalFetch = global.fetch;
const originalBaseUrl = process.env.API_BASE_URL;

function respondWith(body: unknown, status = 200, contentType = "application/json") {
  const fetchMock = jest.fn(() =>
    Promise.resolve({
      status,
      ok: status < 400,
      json: () =>
        contentType === "application/json"
          ? Promise.resolve(body)
          : Promise.reject(new SyntaxError("Unexpected token <")),
    } as Response),
  );

  global.fetch = fetchMock as unknown as typeof fetch;

  return fetchMock;
}

const lastCall = (fetchMock: jest.Mock): FetchArgs =>
  fetchMock.mock.calls.at(-1) as unknown as FetchArgs;

beforeEach(() => {
  process.env.API_BASE_URL = "http://localhost:4000";
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.API_BASE_URL = originalBaseUrl;
  jest.restoreAllMocks();
});

describe("apiRequest", () => {
  it("returns data from inside the envelope, not the envelope", async () => {
    respondWith({
      success: true,
      message: "Session loaded",
      data: { user: { email: "ada@example.com" } },
      meta: { statusCode: 200, requestId: "r", timestamp: "t" },
    });

    await expect(apiRequest("/api/auth/me", { accessToken: "token" })).resolves.toEqual({
      user: { email: "ada@example.com" },
    });
  });

  it("throws the API's code, status and details rather than a bare message", async () => {
    respondWith(
      {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "The request did not pass validation.",
          details: ["email must be an email"],
        },
        meta: { statusCode: 400 },
      },
      400,
    );

    const failure = apiRequest("/api/auth/login", {
      method: "POST",
      authenticated: false,
      body: {},
    });

    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_FAILED",
      message: "The request did not pass validation.",
    });
    await expect(failure.catch((error: unknown) => validationMessages(error))).resolves.toEqual([
      "email must be an email",
    ]);
  });

  it("sends the access token as a bearer, and a request id to trace by", async () => {
    const fetchMock = respondWith({ success: true, message: "ok", data: null, meta: {} });

    await apiRequest("/api/auth/me", { accessToken: "the-token" });

    const [url, init] = lastCall(fetchMock);
    const headers = init.headers as Record<string, string>;
    expect(url).toBe("http://localhost:4000/api/auth/me");
    expect(headers.authorization).toBe("Bearer the-token");
    expect(headers["x-request-id"]).toEqual(expect.any(String));
  });

  it("sends no token when the route is reached before signing in", async () => {
    const fetchMock = respondWith({ success: true, message: "ok", data: null, meta: {} });

    await apiRequest("/api/invites/lookup", {
      method: "POST",
      authenticated: false,
      body: { token: "t" },
    });

    const [, init] = lastCall(fetchMock);
    expect(init.headers).not.toHaveProperty("authorization");
    expect(init.body).toBe(JSON.stringify({ token: "t" }));
    expect(init.headers).toMatchObject({ "content-type": "application/json" });
  });

  it("forwards the caller's address when it is given one, for throttling", async () => {
    const fetchMock = respondWith({ success: true, message: "ok", data: null, meta: {} });

    await apiRequest("/api/auth/login", {
      method: "POST",
      authenticated: false,
      body: {},
      clientAddress: "203.0.113.5",
    });

    const [, init] = lastCall(fetchMock);
    expect(init.headers).toMatchObject({ "x-forwarded-for": "203.0.113.5" });
  });

  it("forwards no address when there is none, rather than inventing one", async () => {
    const fetchMock = respondWith({ success: true, message: "ok", data: null, meta: {} });

    await apiRequest("/api/auth/login", { method: "POST", authenticated: false, body: {} });

    expect(lastCall(fetchMock)[1].headers).not.toHaveProperty("x-forwarded-for");
  });

  it("never caches a reply that depended on a token", async () => {
    const fetchMock = respondWith({ success: true, message: "ok", data: null, meta: {} });

    await apiRequest("/api/auth/me", { accessToken: "token", tags: ["pathways"] });

    const [, init] = lastCall(fetchMock);
    // Tags are ignored here on purpose: caching this would serve one person's
    // data to the next.
    expect(init.cache).toBe("no-store");
    expect(init).not.toHaveProperty("next");
  });

  it("caches a tagged public read, so revalidateTag can clear it", async () => {
    const fetchMock = respondWith({ success: true, message: "ok", data: [], meta: {} });

    await apiRequest("/api/academy/pathways", { authenticated: false, tags: ["pathways"] });

    const [, init] = lastCall(fetchMock);
    expect(init).toMatchObject({ next: { tags: ["pathways"] } });
    expect(init.cache).toBeUndefined();
  });

  it("turns a non-JSON reply into a plain failure instead of crashing", async () => {
    respondWith("<html>502 Bad Gateway</html>", 502, "text/html");

    await expect(apiRequest("/api/auth/me", { accessToken: "token" })).rejects.toMatchObject({
      status: 502,
      code: "UPSTREAM_ERROR",
    });
  });

  it("rejects a 200 that is not the envelope at all", async () => {
    respondWith({ user: "surprise" });

    await expect(apiRequest("/api/auth/me", { accessToken: "token" })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("says which variable is missing when the API base URL is not configured", async () => {
    delete process.env.API_BASE_URL;
    respondWith({ success: true, message: "ok", data: null, meta: {} });

    await expect(apiRequest("/api/auth/me", { accessToken: "token" })).rejects.toThrow(
      /API_BASE_URL/,
    );
  });
});

/*
  A paginated reply carries its totals in `meta`, which apiRequest drops.
  Dropping them silently is how a list quietly stops at its first page and
  nobody notices the rest exist.
*/
describe("apiPage", () => {
  it("returns the items and how many there are in total", async () => {
    respondWith({
      success: true,
      message: "Institutions loaded",
      data: [{ id: "a" }, { id: "b" }],
      meta: { pagination: { page: 1, pageSize: 2, totalItems: 5, totalPages: 3 } },
    });

    await expect(apiPage("/api/institutions?pageSize=2", { accessToken: "t" })).resolves.toEqual({
      items: [{ id: "a" }, { id: "b" }],
      pagination: { page: 1, pageSize: 2, totalItems: 5, totalPages: 3 },
    });
  });

  it("treats a reply without pagination as one complete page, rather than failing", async () => {
    respondWith({ success: true, message: "ok", data: [{ id: "a" }], meta: {} });

    await expect(apiPage("/api/things", { accessToken: "t" })).resolves.toEqual({
      items: [{ id: "a" }],
      pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
    });
  });

  it("throws the API's failure exactly as apiRequest does", async () => {
    respondWith(
      { success: false, error: { code: "INSUFFICIENT_ROLE", message: "No." }, meta: {} },
      403,
    );

    await expect(apiPage("/api/institutions", { accessToken: "t" })).rejects.toMatchObject({
      status: 403,
      code: "INSUFFICIENT_ROLE",
    });
  });
});

