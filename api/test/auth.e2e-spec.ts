import { jest } from "@jest/globals";
import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
  type INestApplication,
} from "@nestjs/common";
import request from "supertest";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../src/common/http/api-response.js";
import { AuthModule } from "../src/modules/auth/auth.module.js";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

/*
  The auth HTTP contract: routes, validation, the global guard and the
  envelope. AuthService is stubbed — its behaviour is covered by its own spec.
*/
describe("Auth (e2e)", () => {
  let app: INestApplication;
  let signAccessToken: (claims: object) => Promise<string>;
  const auth = {
    login: fn(),
    refresh: fn(),
    logout: fn(),
    getSessionContext: fn(),
    switchInstitution: fn(),
    requestPasswordReset: fn(),
    resetPassword: fn(),
  };

  beforeAll(async () => {
    ({ app, signAccessToken } = await createTestApp({
      imports: [AuthModule],
      overrides: [
        { provide: AuthService, useValue: auth },
      ],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const server = () => app.getHttpServer();

  describe("POST /api/auth/login", () => {
    it("signs in, with the service's result as data", async () => {
      auth.login.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" });

      const response = await request(server())
        .post("/api/auth/login")
        .set("user-agent", "e2e-agent")
        .send({ email: "ada@example.com", password: "correct horse" })
        .expect(200);

      expect(asSuccess(response.body)).toMatchObject({
        success: true,
        message: "Signed in",
        data: { accessToken: "access", refreshToken: "refresh" },
        meta: { statusCode: 200 },
      });
      expect(auth.login).toHaveBeenCalledWith(
        { email: "ada@example.com", password: "correct horse" },
        expect.objectContaining({ userAgent: "e2e-agent" }),
      );
    });

    it("rejects a malformed body before reaching the service", async () => {
      const response = await request(server())
        .post("/api/auth/login")
        .send({ email: "not-an-email" })
        .expect(400);

      expect(asFailure(response.body).error.code).toBe("VALIDATION_FAILED");
      expect(asFailure(response.body).error.details).toEqual(
        expect.arrayContaining([expect.stringContaining("email")]),
      );
      expect(auth.login).not.toHaveBeenCalled();
    });

    it("rejects fields the DTO does not declare", async () => {
      await request(server())
        .post("/api/auth/login")
        .send({ email: "ada@example.com", password: "x", platformRole: "PLATFORM_ADMIN" })
        .expect(400);

      expect(auth.login).not.toHaveBeenCalled();
    });

    it("passes a service refusal through with its code", async () => {
      auth.login.mockRejectedValue(
        new UnauthorizedException({
          code: "INVALID_CREDENTIALS",
          message: "The email or password is incorrect.",
        }),
      );

      const response = await request(server())
        .post("/api/auth/login")
        .send({ email: "ada@example.com", password: "wrong" })
        .expect(401);

      expect(asFailure(response.body)).toMatchObject({
        success: false,
        error: { code: "INVALID_CREDENTIALS" },
        meta: { statusCode: 401 },
      });
    });

    it("answers a throttled attempt with 429 and a Retry-After the caller can act on", async () => {
      auth.login.mockRejectedValue(
        new HttpException(
          {
            code: "TOO_MANY_ATTEMPTS",
            message: "Too many attempts. Try again in about 5 minutes.",
            details: { retryAfterSeconds: 300 },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      const response = await request(server())
        .post("/api/auth/login")
        .send({ email: "ada@example.com", password: "wrong" })
        .expect(429);

      // The header is what an HTTP client obeys; the body is what a person is
      // shown. A 429 without the header is a 429 nothing can wait out.
      expect(response.headers["retry-after"]).toBe("300");
      expect(asFailure(response.body)).toMatchObject({
        success: false,
        error: {
          code: "TOO_MANY_ATTEMPTS",
          details: { retryAfterSeconds: 300 },
        },
        meta: { statusCode: 429 },
      });
    });

    it("hands the forwarded client address to the service, so it can be throttled on", async () => {
      auth.login.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" });

      await request(server())
        .post("/api/auth/login")
        .set("x-forwarded-for", "203.0.113.5, 10.0.0.1")
        .send({ email: "ada@example.com", password: "correct horse" })
        .expect(200);

      const [, client] = auth.login.mock.calls[0] as [unknown, { forwardedFor?: string }];
      // The first entry is the original caller; the rest are the proxies.
      expect(client.forwardedFor).toBe("203.0.113.5");
    });
  });

  describe("GET /api/auth/me", () => {
    it("requires a token", async () => {
      const response = await request(server()).get("/api/auth/me").expect(401);

      expect(asFailure(response.body).error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("rejects a token that does not verify", async () => {
      const response = await request(server())
        .get("/api/auth/me")
        .set("authorization", "Bearer not.a.token")
        .expect(401);

      expect(asFailure(response.body).error.code).toBe("INVALID_ACCESS_TOKEN");
    });

    it("passes the verified user to the service", async () => {
      auth.getSessionContext.mockResolvedValue({ user: { id: "user-1" } });
      const token = await signAccessToken({ institutionId: "i-1", institutionRole: "LEARNER" });

      await request(server())
        .get("/api/auth/me")
        .set("authorization", `Bearer ${token}`)
        .expect(200);

      expect(auth.getSessionContext).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          institutionId: "i-1",
          institutionRole: "LEARNER",
        }),
      );
    });
  });

  it("POST /api/auth/switch-institution validates the institution id", async () => {
    const token = await signAccessToken({});

    await request(server())
      .post("/api/auth/switch-institution")
      .set("authorization", `Bearer ${token}`)
      .send({ institutionId: "not-a-uuid" })
      .expect(400);

    expect(auth.switchInstitution).not.toHaveBeenCalled();
  });

  it("POST /api/auth/forgot-password gives the same answer for any email", async () => {
    auth.requestPasswordReset.mockResolvedValue(undefined);

    const [known, unknown] = await Promise.all([
      request(server()).post("/api/auth/forgot-password").send({ email: "ada@example.com" }),
      request(server()).post("/api/auth/forgot-password").send({ email: "nobody@example.com" }),
    ]);

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(asSuccess(known.body).message).toBe(asSuccess(unknown.body).message);
    expect(asSuccess(known.body).data).toBeNull();
  });

  it("POST /api/auth/reset-password enforces the password policy", async () => {
    const response = await request(server())
      .post("/api/auth/reset-password")
      .send({ token: "t".repeat(43), password: "short" })
      .expect(400);

    expect(asFailure(response.body).error.details).toEqual(
      expect.arrayContaining([expect.stringContaining("password")]),
    );
  });
});
