import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import type { ApiErrorResponse } from "../http/api-response.js";
import { REQUEST_ID_HEADER } from "../interceptors/response-transform.interceptor.js";

/** Comparing a plain number against the HttpStatus enum is not type-safe. */
const SERVER_ERROR = 500;

/** Stable, machine-readable codes for the statuses the API actually returns. */
const CODE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.GONE]: "GONE",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "UNPROCESSABLE_ENTITY",
  [HttpStatus.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "INTERNAL_ERROR",
  [HttpStatus.SERVICE_UNAVAILABLE]: "SERVICE_UNAVAILABLE",
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const { status, body } = toErrorResponse(exception, request);

    // Anything at 500 is our bug, not the caller's: log it with the stack, and
    // tell the caller nothing about our internals.
    if (status >= SERVER_ERROR) {
      this.logger.error(
        `${request?.method ?? "?"} ${request?.url ?? "?"} failed`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }
}

/**
 * The status and failure envelope for any exception. Exported so the fallback
 * not-found handler in app.setup.ts, which runs outside Nest's filters, sends
 * exactly the same shape.
 */
export function toErrorResponse(
  exception: unknown,
  request: Request | undefined,
): { status: number; body: ApiErrorResponse } {
  const status =
    exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

  const { code, message, details } = describe(exception, status);

  return {
    status,
    body: {
      success: false,
      error: { code, message, ...(details === undefined ? {} : { details }) },
      meta: {
        // The status about to be sent. Not response.statusCode: that is still
        // Express's default of 200 until response.status() runs.
        statusCode: status,
        requestId: readRequestId(request),
        timestamp: new Date().toISOString(),
      },
    },
  };
}

function describe(
  exception: unknown,
  status: number,
): { code: string; message: string; details?: unknown } {
  const fallbackCode = CODE_BY_STATUS[status] ?? "ERROR";

  /*
    Anything that is not a deliberate HttpException — or is a bare 500 — is our
    bug, and its message may describe our internals, so the caller is told
    nothing. Other statuses, 503 from a readiness probe included, are answers
    we chose to give, so their payload is passed through.
  */
  if (!(exception instanceof HttpException) || status === SERVER_ERROR) {
    return { code: "INTERNAL_ERROR", message: "Something went wrong." };
  }

  if (exception instanceof HttpException) {
    const payload = exception.getResponse();

    if (typeof payload === "string") {
      return { code: fallbackCode, message: payload };
    }

    const body = payload as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
      error?: unknown;
    };

    // The global ValidationPipe puts one string per failed constraint in
    // `message`; surface those as details and keep `message` a single line.
    if (Array.isArray(body.message)) {
      return {
        code: "VALIDATION_FAILED",
        message: "The request did not pass validation.",
        details: body.message,
      };
    }

    return {
      code: typeof body.code === "string" ? body.code : fallbackCode,
      message: typeof body.message === "string" ? body.message : exception.message,
      // An exception may carry its own detail, such as which dependency is down.
      details: body.details,
    };
  }

  return { code: fallbackCode, message: "Something went wrong." };
}

function readRequestId(request: Request | undefined): string {
  const header = request?.headers?.[REQUEST_ID_HEADER];
  const value = Array.isArray(header) ? header[0] : header;

  return value && value.length > 0 ? value : randomUUID();
}
