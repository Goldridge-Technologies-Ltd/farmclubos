import { jest } from "@jest/globals";
import type {
  ArgumentsHost} from "@nestjs/common";
import {
  BadRequestException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { ApiErrorResponse } from "../http/api-response.js";
import { AllExceptionsFilter } from "./all-exceptions.filter.js";

type Captured = { status: number; body: ApiErrorResponse };

function hostCapturing(captured: Partial<Captured>): ArgumentsHost {
  const response = {
    status(code: number) {
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
