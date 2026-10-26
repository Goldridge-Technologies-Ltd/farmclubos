import { jest } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../src/common/http/api-response.js";
import { IndependentLearnersModule } from "../src/modules/independent-learners/independent-learners.module.js";
import { SelfEnrolmentService } from "../src/modules/independent-learners/self-enrolment.service.js";
import { SignupService } from "../src/modules/independent-learners/signup.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

/*
  The HTTP contract for people learning on their own: routes, validation, the
  global guard and the envelope. The services are stubbed; their behaviour is
  covered by their own specs.
*/
describe("Independent learners (e2e)", () => {
  let app: INestApplication;
  let signAccessToken: (claims: object) => Promise<string>;
  const signups = { signUp: fn() };
  const enrolments = { start: fn() };

  beforeAll(async () => {
    ({ app, signAccessToken } = await createTestApp({
      imports: [IndependentLearnersModule],
      overrides: [
        { provide: SignupService, useValue: signups },
        { provide: SelfEnrolmentService, useValue: enrolments },
      ],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const server = () => app.getHttpServer();

  describe("POST /api/auth/signup", () => {
    it("needs no access token, and gives the same answer for any address", async () => {
      signups.signUp.mockResolvedValue(undefined);

      const [known, unknown] = await Promise.all([
        request(server()).post("/api/auth/signup").send({ email: "ada@example.com" }),
        request(server()).post("/api/auth/signup").send({ email: "newcomer@example.com" }),
      ]);

      expect(known.status).toBe(200);
      expect(unknown.status).toBe(200);
      expect(asSuccess(known.body).message).toBe(asSuccess(unknown.body).message);
      expect(asSuccess(known.body).data).toBeNull();
    });

    it("refuses something that is not an email address", async () => {
      const response = await request(server())
        .post("/api/auth/signup")
        .send({ email: "not an email" })
        .expect(400);

      expect(asFailure(response.body).error.code).toBe("VALIDATION_FAILED");
      expect(signups.signUp).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/academy/pathways/:pathwaySlug/start", () => {
    it("needs a session", async () => {
      await request(server()).post("/api/academy/pathways/foundation/start").expect(401);
      expect(enrolments.start).not.toHaveBeenCalled();
    });

    it("starts the pathway in the path for the signed-in caller", async () => {
      const started = { enrolmentId: "enrolment-1", status: "ACTIVE", session: null };
      enrolments.start.mockResolvedValue(started);
      const token = await signAccessToken({ sub: "user-1", institutionId: null });

      const response = await request(server())
        .post("/api/academy/pathways/foundation/start")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(asSuccess(response.body).data).toEqual(started);
      expect(enrolments.start).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1" }),
        "foundation",
      );
    });
  });
});
