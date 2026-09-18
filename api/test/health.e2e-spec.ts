import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../src/common/http/api-response.js";
import { PrismaService } from "../src/lib/database/prisma.service.js";
import { HealthModule } from "../src/modules/health/health.module.js";
import { createTestApp } from "./support/create-test-app.js";

/** supertest types `body` as `any`; name the contract we are asserting. */
const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

/*
  Runs through the real request pipeline, including the global JwtAuthGuard,
  so it also proves the probes stay reachable without a token.
*/
describe("Health (e2e)", () => {
  let app: INestApplication;
  let unreachable = false;

  beforeAll(async () => {
    ({ app } = await createTestApp({
      imports: [HealthModule],
      overrides: [
        { provide: PrismaService, useValue: { isReachable: () => Promise.resolve(!unreachable) } },
      ],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health answers without a token, in the success envelope", async () => {
    const response = await request(app.getHttpServer()).get("/health").expect(200);

    expect(asSuccess(response.body)).toMatchObject({
      success: true,
      message: "API is running",
      data: { status: "ok", uptime: expect.any(Number) },
      meta: {
        statusCode: 200,
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("GET /health echoes an inbound request id", async () => {
    const response = await request(app.getHttpServer())
      .get("/health")
      .set("x-request-id", "trace-abc")
      .expect(200);

    expect(asSuccess(response.body).meta.requestId).toBe("trace-abc");
  });

  it("GET /health/ready reports every dependency check", async () => {
    const response = await request(app.getHttpServer()).get("/health/ready").expect(200);

    expect(asSuccess(response.body)).toMatchObject({
      success: true,
      message: "Readiness checks completed",
      data: { status: "ok", checks: { database: "ok" } },
      meta: { statusCode: 200 },
    });
  });

  it("GET /health/ready answers 503 when the database is unreachable", async () => {
    unreachable = true;

    const response = await request(app.getHttpServer()).get("/health/ready").expect(503);

    expect(asFailure(response.body)).toMatchObject({
      success: false,
      error: { code: "NOT_READY", details: { database: "down" } },
      meta: { statusCode: 503 },
    });

    unreachable = false;
  });

  /*
    Nest only mounts its not-found handler under the global prefix, so without
    a fallback these fell through to Express's HTML 404 page.
  */
  it.each(["/api/does-not-exist", "/health/does-not-exist", "/does-not-exist"])(
    "an unknown route (%s) returns the JSON failure envelope, not an HTML page",
    async (route) => {
      const response = await request(app.getHttpServer())
        .get(route)
        .expect("content-type", /application\/json/)
        .expect(404);

      expect(asFailure(response.body)).toMatchObject({
        success: false,
        error: { code: "NOT_FOUND", message: `Cannot GET ${route}` },
        meta: { statusCode: 404, requestId: expect.any(String) },
      });
    },
  );
});
