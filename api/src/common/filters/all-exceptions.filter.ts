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
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { code, message, details } = describe(exception, status);

    // Anything at 500 is our bug, not the caller's: log it with the stack, and
    // tell the caller nothing about our internals.
    if (status >= SERVER_ERROR) {
      this.logger.error(
        `${request?.method ?? "?"} ${request?.url ?? "?"} failed`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      error: { code, message, ...(details === undefined ? {} : { details }) },
      meta: {
        // The status we are about to send. Not response.statusCode: that is
        // still Express's default of 200 until response.status() runs below.
        statusCode: status,
        requestId: readRequestId(request),
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(body);
  }
}

function describe(
  exception: unknown,
  status: number,
): { code: string; message: string; details?: unknown } {
  const fallbackCode = CODE_BY_STATUS[status] ?? "ERROR";

  if (status >= SERVER_ERROR) {
    return { code: fallbackCode, message: "Something went wrong." };
  }

  if (exception instanceof HttpException) {
    const payload = exception.getResponse();

    if (typeof payload === "string") {
      return { code: fallbackCode, message: payload };
    }

    const body = payload as {
      code?: unknown;
      message?: unknown;
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
      message:
        typeof body.message === "string" ? body.message : exception.message,
    };
  }

  return { code: fallbackCode, message: "Something went wrong." };
}

function readRequestId(request: Request | undefined): string {
  const header = request?.headers?.[REQUEST_ID_HEADER];
  const value = Array.isArray(header) ? header[0] : header;

  return value && value.length > 0 ? value : randomUUID();
}
