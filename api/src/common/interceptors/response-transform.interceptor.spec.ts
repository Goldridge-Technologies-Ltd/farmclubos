import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { firstValueFrom, of } from "rxjs";
import { PaginatedResult } from "../http/api-response.js";
import {
  REQUEST_ID_HEADER,
  ResponseTransformInterceptor,
} from "./response-transform.interceptor.js";

function contextWithHeaders(
  headers: Record<string, string | string[] | undefined> = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

function handlerReturning(value: unknown): CallHandler {
  return { handle: () => of(value) } as CallHandler;
}

describe("ResponseTransformInterceptor", () => {
  let interceptor: ResponseTransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseTransformInterceptor();
  });

  it("wraps plain data in the success envelope", async () => {
    const result = await firstValueFrom(
      interceptor.intercept(
        contextWithHeaders(),
        handlerReturning({ id: "pathway-1" }),
      ),
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: "pathway-1" });
    expect(result.meta.requestId).toEqual(expect.any(String));
    expect(Date.parse(result.meta.timestamp)).not.toBeNaN();
  });

  it("reuses an inbound request id so traces join up", async () => {
    const result = await firstValueFrom(
      interceptor.intercept(
        contextWithHeaders({ [REQUEST_ID_HEADER]: "trace-123" }),
        handlerReturning("ok"),
      ),
    );

    expect(result.meta.requestId).toBe("trace-123");
  });

  it("generates a request id when none is supplied", async () => {
    const result = await firstValueFrom(
      interceptor.intercept(contextWithHeaders(), handlerReturning("ok")),
    );

    expect(result.meta.requestId).toHaveLength(36);
  });

  it("lifts pagination out of a PaginatedResult", async () => {
    const page = PaginatedResult.of([{ id: "a" }, { id: "b" }], 5, 1, 2);

    const result = await firstValueFrom(
      interceptor.intercept(contextWithHeaders(), handlerReturning(page)),
    );

    expect(result.data).toEqual([{ id: "a" }, { id: "b" }]);
    expect(result.meta.pagination).toEqual({
      page: 1,
      pageSize: 2,
      totalItems: 5,
      totalPages: 3,
    });
  });

  it("normalises an empty controller return to null", async () => {
    const result = await firstValueFrom(
      interceptor.intercept(contextWithHeaders(), handlerReturning(undefined)),
    );

    expect(result.data).toBeNull();
  });
});
