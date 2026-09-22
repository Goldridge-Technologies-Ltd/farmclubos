import { jest } from "@jest/globals";
import { NotFoundException, type INestApplication } from "@nestjs/common";
import request from "supertest";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../src/common/http/api-response.js";
import { AcademyModule } from "../src/modules/academy/academy.module.js";
import { AcademyService } from "../src/modules/academy/academy.service.js";
import { CohortsModule } from "../src/modules/cohorts/cohorts.module.js";
import { CohortsService } from "../src/modules/cohorts/cohorts.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

/*
  The catalogue's and enrolments' HTTP contract: the global guard, the slug
  routing, the envelope and the 404. The services are stubbed — their rules
  are covered by their own specs.
*/
describe("Academy (e2e)", () => {
  let app: INestApplication;
  let signAccessToken: (claims: object) => Promise<string>;
  const academy = {
    listPathways: fn(),
    getPathway: fn(),
    getModule: fn(),
    getLesson: fn(),
  };
  const cohorts = { listMine: fn(), getMine: fn() };

  beforeAll(async () => {
    ({ app, signAccessToken } = await createTestApp({
      imports: [AcademyModule, CohortsModule],
      overrides: [
        { provide: AcademyService, useValue: academy },
        { provide: CohortsService, useValue: cohorts },
      ],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const server = () => app.getHttpServer();
  const asLearner = async () =>
    `Bearer ${await signAccessToken({ institutionId: "institution-1", institutionRole: "LEARNER" })}`;

  describe("GET /api/academy/pathways", () => {
    it("needs a session: the catalogue is not a brochure", async () => {
      const response = await request(server()).get("/api/academy/pathways").expect(401);

      expect(asFailure(response.body).error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("returns the catalogue inside the envelope", async () => {
      academy.listPathways.mockResolvedValue([{ slug: "foundation", moduleCount: 7 }]);

      const response = await request(server())
        .get("/api/academy/pathways")
        .set("authorization", await asLearner())
        .expect(200);

      expect(asSuccess(response.body)).toMatchObject({
        success: true,
        message: "Pathways loaded",
        data: [{ slug: "foundation", moduleCount: 7 }],
        meta: { statusCode: 200 },
      });
    });
  });

  describe("the nested slug routes", () => {
    it("reads all three slugs off the path in order", async () => {
      academy.getLesson.mockResolvedValue({ slug: "introduction" });

      await request(server())
        .get("/api/academy/pathways/foundation/modules/fundamentals/lessons/introduction")
        .set("authorization", await asLearner())
        .expect(200);

      expect(academy.getLesson).toHaveBeenCalledWith(
        "foundation",
        "fundamentals",
        "introduction",
      );
    });

    it("answers 404 with a code, not an HTML page, for an unpublished slug", async () => {
      academy.getPathway.mockRejectedValue(
        new NotFoundException({
          code: "NOT_FOUND",
          message: "That pathway does not exist, or has not been published.",
        }),
      );

      const response = await request(server())
        .get("/api/academy/pathways/being-written")
        .set("authorization", await asLearner())
        .expect(404);

      expect(asFailure(response.body)).toMatchObject({
        success: false,
        error: { code: "NOT_FOUND" },
        meta: { statusCode: 404 },
      });
    });
  });

  describe("GET /api/enrolments/mine", () => {
    it("hands the service the caller from the token", async () => {
      cohorts.listMine.mockResolvedValue([]);

      await request(server())
        .get("/api/enrolments/mine")
        .set("authorization", await asLearner())
        .expect(200);

      const [caller] = cohorts.listMine.mock.calls[0] as [{ institutionId: string }];
      expect(caller.institutionId).toBe("institution-1");
    });

    it("refuses an enrolment id that is not a uuid before reaching the service", async () => {
      const response = await request(server())
        .get("/api/enrolments/mine/not-a-uuid")
        .set("authorization", await asLearner())
        .expect(400);

      expect(asFailure(response.body).meta.statusCode).toBe(400);
      expect(cohorts.getMine).not.toHaveBeenCalled();
    });
  });
});
