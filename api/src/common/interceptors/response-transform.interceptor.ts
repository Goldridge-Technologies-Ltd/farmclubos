import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { Observable, map } from "rxjs";
import { PaginatedResult } from "../http/api-response.js";
import type {
  ApiSuccessResponse,
  ResponseMeta,
} from "../http/api-response.js";

/** The header a proxy or the webapp can set to trace a request end to end. */
export const REQUEST_ID_HEADER = "x-request-id";

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<unknown>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = readRequestId(request);

    return next.handle().pipe(
      map((payload) => {
        const meta: ResponseMeta = {
          requestId,
          timestamp: new Date().toISOString(),
        };

        // A paginated controller result carries its own meta; lift it out so
        // clients read `meta.pagination` rather than digging through `data`.
        if (payload instanceof PaginatedResult) {
          return {
            success: true as const,
            data: payload.items,
            meta: { ...meta, pagination: payload.pagination },
          };
        }

        return { success: true as const, data: payload ?? null, meta };
      }),
    );
  }
}

/** Reuses an inbound request id when there is one, so traces join up. */
function readRequestId(request: Request | undefined): string {
  const header = request?.headers?.[REQUEST_ID_HEADER];
  const value = Array.isArray(header) ? header[0] : header;

  return value && value.length > 0 ? value : randomUUID();
}
