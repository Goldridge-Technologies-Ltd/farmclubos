import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "../session-cookies";
import { ApiError } from "./errors";

/*
  The only way this app talks to the API.

  It runs on the server exclusively. The browser never calls the API: it talks
  to this app, which holds the tokens in its own httpOnly cookies and calls the
  API server-to-server with a bearer token. That is why API_BASE_URL is not a
  NEXT_PUBLIC_ variable — the browser has no use for it.

  The API wraps every reply in `{ success, message, data, meta }`. It is
  unwrapped here, once, so the rest of the app works with plain data and plain
  thrown errors.
*/

type SuccessEnvelope<T> = {
  success: true;
  message: string;
  data: T;
  meta?: { pagination?: PageInfo };
};

/** What the API says about a paginated list, from `meta.pagination`. */
export type PageInfo = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type Page<T> = { items: T[]; pagination: PageInfo };
type FailureEnvelope = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /**
   * Send the signed-in user's access token. Default true. Set false for the
   * routes reached before anyone is signed in: sign-in, invite acceptance,
   * password reset.
   */
  authenticated?: boolean;
  /**
   * Use this token rather than the cookie — for a call made in the same
   * request that issued it, before the cookie exists.
   */
  accessToken?: string;
  /**
   * Cache tags for `revalidateTag`. Only for data that is the same for
   * everyone; a per-user response must never be cached (see below).
   */
  tags?: string[];
  /**
   * The caller's address, forwarded so the API can throttle sign-in attempts
   * against it as well as the account. See ./forwarded-address.
   */
  clientAddress?: string;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return (await send<T>(path, options)).data;
}

/**
 * A paginated list, with the totals `apiRequest` would drop. Use it for any
 * list that can outgrow one page, so a screen can say there is more rather
 * than silently stopping at the first page.
 */
export async function apiPage<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Page<T>> {
  const envelope = await send<T[]>(path, options);
  const items = envelope.data;

  return {
    items,
    // A list the API did not paginate is one complete page.
    pagination: envelope.meta?.pagination ?? {
      page: 1,
      pageSize: items.length,
      totalItems: items.length,
      totalPages: 1,
    },
  };
}

/** One request, returning the success envelope or throwing the failure. */
async function send<T>(path: string, options: ApiRequestOptions): Promise<SuccessEnvelope<T>> {
  const { method = "GET", body, authenticated = true, tags, signal } = options;

  const headers: Record<string, string> = {
    accept: "application/json",
    // Echoed back in `meta.requestId`, so a log line here matches one there.
    "x-request-id": randomUUID(),
  };

  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  if (options.clientAddress) {
    headers["x-forwarded-for"] = options.clientAddress;
  }

  const token = authenticated
    ? (options.accessToken ?? (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value)
    : options.accessToken;

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    signal,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    /*
      A reply that depended on a bearer token must never be cached: the next
      person would be served someone else's data. Only explicitly tagged,
      unauthenticated reads are cacheable.
    */
    ...(authenticated || !tags ? { cache: "no-store" as const } : { next: { tags } }),
  });

  const envelope = await readEnvelope<T>(response);

  if (!envelope.success) {
    throw new ApiError(
      response.status,
      envelope.error.code,
      envelope.error.message,
      envelope.error.details,
    );
  }

  return envelope;
}

async function readEnvelope<T>(
  response: Response,
): Promise<SuccessEnvelope<T> | FailureEnvelope> {
  let parsed: unknown;

  try {
    parsed = await response.json();
  } catch {
    // Not JSON at all: a proxy error page, or the API being unreachable.
    return {
      success: false,
      error: {
        code: response.ok ? "INVALID_RESPONSE" : "UPSTREAM_ERROR",
        message: "The service is unavailable. Try again shortly.",
      },
    };
  }

  if (isEnvelope(parsed)) {
    return parsed as SuccessEnvelope<T> | FailureEnvelope;
  }

  return {
    success: false,
    error: {
      code: "INVALID_RESPONSE",
      message: "The service returned something unexpected.",
    },
  };
}

function isEnvelope(value: unknown): boolean {
  return typeof value === "object" && value !== null && "success" in value;
}

function baseUrl(): string {
  const url = process.env.API_BASE_URL;

  if (!url) {
    throw new Error(
      "API_BASE_URL is not set. Deployed, set it in the host's environment " +
        "variables; locally, copy webapp/.env.example to webapp/.env.local — " +
        "see docs/guides/local-dev.md.",
    );
  }

  return url.replace(/\/+$/, "");
}
