import { jest } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { ApiSuccessResponse } from "../src/common/http/api-response.js";
import { ProgressModule } from "../src/modules/progress/progress.module.js";
import { ProgressService } from "../src/modules/progress/progress.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const INSTITUTION = "01a0d0d8-0000-7000-8000-000000000021";
const LESSON = "01a0d0d8-0000-7000-8000-000000000022";
const SCENE = "01a0d0d8-0000-7000-8000-000000000023";

/*
  Progress routes' HTTP contract. The learner always comes from the token;
  the service is stubbed, since its rules have their own spec.
*/
describe("Progress (e2e)", () => {
  let app: INestApplication;
  let signAccessToken: (claims: object) => Promise<string>;
  const progress = {
    myJourney: fn(),
    completeLesson: fn(),
    completeScene: fn(),
    lessonProgress: fn(),
    recomputePathway: fn(),
  };

  beforeAll(async () => {
    ({ app, signAccessToken } = await createTestApp({
      imports: [ProgressModule],
      overrides: [{ provide: ProgressService, useValue: progress }],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const server = () => app.getHttpServer();
  const asLearner = async () =>
    `Bearer ${await signAccessToken({ institutionId: INSTITUTION, institutionRole: "LEARNER" })}`;

  describe("POST /api/progress/scenes/complete", () => {
    it("records the scene, inside the envelope", async () => {
      progress.completeScene.mockResolvedValue({
        sceneId: SCENE,
        scenesCompleted: 3,
        sceneCount: 3,
        lessonCompleted: true,
        progressPercent: 29,
      });

      const response = await request(server())
        .post("/api/progress/scenes/complete")
        .set("authorization", await asLearner())
        .send({ sceneId: SCENE })
        .expect(200);

      expect(asSuccess(response.body)).toMatchObject({
        message: "Scene completed",
        data: { lessonCompleted: true, progressPercent: 29 },
      });
    });

    it("refuses a scene id that is not a uuid", async () => {
      await request(server())
        .post("/api/progress/scenes/complete")
        .set("authorization", await asLearner())
        .send({ sceneId: "scene-1" })
        .expect(400);

      expect(progress.completeScene).not.toHaveBeenCalled();
    });

    it("refuses a learner id in the body: progress is only ever the caller's", async () => {
      await request(server())
        .post("/api/progress/scenes/complete")
        .set("authorization", await asLearner())
        .send({ sceneId: SCENE, userId: "01a0d0d8-0000-7000-8000-000000000099" })
        .expect(400);
    });

    it("needs a session", async () => {
      await request(server()).post("/api/progress/scenes/complete").send({ sceneId: SCENE }).expect(401);
    });
  });

  describe("GET /api/progress/lessons/:lessonId", () => {
    it("says where the caller stands in the lesson", async () => {
      progress.lessonProgress.mockResolvedValue({
        enrolled: true,
        status: "IN_PROGRESS",
        completedSceneIds: [SCENE],
      });

      const response = await request(server())
        .get(`/api/progress/lessons/${LESSON}`)
        .set("authorization", await asLearner())
        .expect(200);

      expect(asSuccess(response.body)).toMatchObject({
        message: "Lesson progress loaded",
        data: { enrolled: true, completedSceneIds: [SCENE] },
      });
    });

    it("refuses a lesson id that is not a uuid", async () => {
      await request(server())
        .get("/api/progress/lessons/not-an-id")
        .set("authorization", await asLearner())
        .expect(400);
    });
  });

  describe("POST /api/progress/lessons/complete", () => {
    it("still marks a lesson with no scenes complete", async () => {
      progress.completeLesson.mockResolvedValue({ lessonId: LESSON, status: "COMPLETED" });

      await request(server())
        .post("/api/progress/lessons/complete")
        .set("authorization", await asLearner())
        .send({ lessonId: LESSON })
        .expect(200);
    });
  });
});
