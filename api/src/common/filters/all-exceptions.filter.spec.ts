import { jest } from "@jest/globals";
import type {
  ArgumentsHost} from "@nestjs/common";
import {
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { ApiErrorResponse } from "../http/api-response.js";
import { AllExceptionsFilter } from "./all-exceptions.filter.js";

type Captured = { status: number; body: ApiErrorResponse };

function hostCapturing(captured: Partial<Captured>): ArgumentsHost {
  // Mirrors Express: statusCode starts at 200 and only changes when status()
  // is called. A mock without that default cannot catch a filter that reads
  // the status before setting it.
  const response = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      captured.status = code;
      return this;
    },
    json(body: ApiErrorResponse) {
      captured.body = body;
      return this;
    },
  };

  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: "GET", url: "/health", headers: {} }),
    }),
  } as unknown as ArgumentsHost;
}

describe("AllExceptionsFilter", () => {
  let filter: AllExceptionsFilter;
  let captured: Partial<Captured>;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    captured = {};
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("wraps an HttpException in the failure envelope", () => {
    filter.catch(new NotFoundException("Pathway not found"), hostCapturing(captured));

    expect(captured.status).toBe(HttpStatus.NOT_FOUND);
    expect(captured.body?.success).toBe(false);
    expect(captured.body?.error).toEqual({
      code: "NOT_FOUND",
      message: "Pathway not found",
    });
    expect(captured.body?.meta.requestId).toEqual(expect.any(String));
  });

  it.each([
    [new BadRequestException(), HttpStatus.BAD_REQUEST],
    [new UnauthorizedException(), HttpStatus.UNAUTHORIZED],
    [new NotFoundException(), HttpStatus.NOT_FOUND],
    [new Error("boom"), HttpStatus.INTERNAL_SERVER_ERROR],
  ])(
    "reports the status it actually sends in meta.statusCode (%p)",
    (exception, expected) => {
      filter.catch(exception, hostCapturing(captured));

      expect(captured.status).toBe(expected);
      expect(captured.body?.meta.statusCode).toBe(expected);
    },
  );

  it("maps the status to a stable code", () => {
    filter.catch(new UnauthorizedException(), hostCapturing(captured));

    expect(captured.body?.error.code).toBe("UNAUTHORIZED");
  });

  it("turns ValidationPipe's message array into details", () => {
    filter.catch(
      new BadRequestException(["email must be an email", "password is too short"]),
      hostCapturing(captured),
    );

    expect(captured.status).toBe(HttpStatus.BAD_REQUEST);
    expect(captured.body?.error.code).toBe("VALIDATION_FAILED");
    expect(captured.body?.error.details).toEqual([
      "email must be an email",
      "password is too short",
    ]);
  });

  it("honours an explicit code on the exception body", () => {
    filter.catch(
      new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      }),
      hostCapturing(captured),
    );

    expect(captured.body?.error).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
  });

  it("passes a deliberate 503 through with its code and detail", () => {
    filter.catch(
      new ServiceUnavailableException({
        code: "NOT_READY",
        message: "One or more dependencies are unavailable.",
        details: { database: "down" },
      }),
      hostCapturing(captured),
    );

    expect(captured.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(captured.body?.error).toEqual({
      code: "NOT_READY",
      message: "One or more dependencies are unavailable.",
      details: { database: "down" },
    });
  });

  it("still hides the message of a 500, even a deliberate one", () => {
    filter.catch(
      new InternalServerErrorException("connect ECONNREFUSED 127.0.0.1:5432"),
      hostCapturing(captured),
    );

    expect(captured.body?.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "Something went wrong.",
    });
  });

  it("never leaks internals from an unexpected error", () => {
    filter.catch(
      new Error("connect ECONNREFUSED 127.0.0.1:5432"),
      hostCapturing(captured),
    );

    expect(captured.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(captured.body?.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "Something went wrong.",
    });
  });

  it("logs a server error with its stack", () => {
    const error = jest.spyOn(Logger.prototype, "error");

    filter.catch(new Error("boom"), hostCapturing(captured));

    expect(error).toHaveBeenCalledTimes(1);
  });
});
