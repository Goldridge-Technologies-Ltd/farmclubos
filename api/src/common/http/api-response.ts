/*
  The one response shape the API speaks. Controllers return plain data;
  ResponseTransformInterceptor wraps a success and AllExceptionsFilter wraps a
  failure, so neither a controller nor a service ever builds an envelope by
  hand. webapp/ unwraps it in src/lib/api/client.ts.
*/

export type ResponseMeta = {
  /** Echoed back so a client log line can be matched to a server log line. */
  requestId: string;
  statusCode: number;
  timestamp: string;
  pagination?: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  /** From @CustomMessage on the handler, or "Success" when it has none. */
  message: string;
  data: T;
  meta: ResponseMeta;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    /** A stable, machine-readable code such as INVALID_CREDENTIALS. */
    code: string;
    message: string;
    /** Field-level validation messages, when the failure is a bad request. */
    details?: unknown;
  };
  meta: ResponseMeta;
};

/**
 * Return one of these from a controller to have the interceptor lift `meta`
 * out of the body instead of nesting it inside `data`.
 */
export class PaginatedResult<T> {
  constructor(
    readonly items: T[],
    readonly pagination: PaginationMeta,
  ) {}

  /** Builds the pagination block from a total and the requested page. */
  static of<T>(
    items: T[],
    totalItems: number,
    page: number,
    pageSize: number,
  ): PaginatedResult<T> {
    return new PaginatedResult(items, {
      page,
      pageSize,
      totalItems,
      totalPages: pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0,
    });
  }
}
