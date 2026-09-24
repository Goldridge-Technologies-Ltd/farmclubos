/*
  Failures from the API, in one shape the rest of the app can act on.

  The API answers `{ success: false, error: { code, message, details } }`. The
  `code` is the stable part — `INVALID_CREDENTIALS`, `INVITE_EXPIRED` — so
  screens branch on that, never on the message, which is prose and may change.
*/

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** True when the API refused the caller's identity, not their request. */
export function isUnauthorized(error: unknown): boolean {
  return isApiError(error) && error.status === 401;
}

/** True when the API says there is no such record — or none this caller may see. */
export function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}

/**
 * True when a read by id failed because there is nothing to find: a 404, or a
 * 400 because the id in the URL is not one the API would even parse. Both are
 * not-found to a person; neither is fixed by trying again.
 *
 * Only for reads of one record by an id from the URL. A 400 anywhere else is a
 * real validation failure and must not be quietly turned into a 404.
 */
export function isMissingRecord(error: unknown): boolean {
  return isApiError(error) && (error.status === 404 || error.status === 400);
}

/**
 * The per-field messages behind a VALIDATION_FAILED response, if any. The API
 * sends them as an array of strings from its validation pipe.
 */
export function validationMessages(error: unknown): string[] {
  if (!isApiError(error) || !Array.isArray(error.details)) {
    return [];
  }

  return error.details.filter((detail): detail is string => typeof detail === "string");
}

/**
 * A sentence to show the person. The API writes its messages for them, so they
 * are used as-is; anything else falls back to wording that does not blame them
 * or expose internals.
 */
export function userMessage(
  error: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  if (!isApiError(error)) {
    return fallback;
  }

  // A 500 carries "Something went wrong." from the API's own filter.
  return error.message || fallback;
}
