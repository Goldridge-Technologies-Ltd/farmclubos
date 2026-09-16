import { Global, Module, ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter.js";
import { ResponseTransformInterceptor } from "../src/common/interceptors/response-transform.interceptor.js";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../src/common/http/api-response.js";
import { PrismaService } from "../src/lib/database/prisma.service.js";
import { HealthModule } from "../src/modules/health/health.module.js";

/** supertest types `body` as `any`; name the contract we are asserting. */
const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

/*
  Covers the endpoint contract end to end: status, the response envelope and
  the error case, exactly as a client would see them.
*/
/*
  The database is stubbed: this spec covers the HTTP contract — status, the
  response envelope and the error case — not connectivity. It mirrors the
  production wiring, where PrismaModule is @Global().
*/
@Global()
@Module({
  providers: [
    { provide: PrismaService, useValue: { isReachable: () => Promise.resolve(true) } },
  ],
  exports: [PrismaService],
})
class StubPrismaModule {}

describe("Health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StubPrismaModule, HealthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns the success envelope", async () => {
    const response = await request(app.getHttpServer()).get("/health").expect(200);

    expect(asSuccess(response.body)).toMatchObject({
      success: true,
      data: { status: "ok", uptime: expect.any(Number) },
      meta: {
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
    const response = await request(app.getHttpServer())
      .get("/health/ready")
      .expect(200);

    expect(asSuccess(response.body).data).toEqual({
      status: "ok",
      checks: { database: "ok" },
    });
  });

  it("an unknown route returns the failure envelope", async () => {
    const response = await request(app.getHttpServer())
      .get("/health/does-not-exist")
      .expect(404);

    expect(asFailure(response.body)).toMatchObject({
      success: false,
      error: { code: "NOT_FOUND", message: expect.any(String) },
      meta: { requestId: expect.any(String) },
    });
  });
});
