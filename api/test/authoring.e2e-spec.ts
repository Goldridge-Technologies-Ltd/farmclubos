import { jest } from "@jest/globals";
import { BadRequestException, type INestApplication } from "@nestjs/common";
import request from "supertest";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../src/common/http/api-response.js";
import { AuthoringModule } from "../src/modules/authoring/authoring.module.js";
import { CurriculumService } from "../src/modules/authoring/curriculum.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const PATHWAY = "01a0d0d8-0000-7000-8000-000000000011";
const MODULE = "01a0d0d8-0000-7000-8000-000000000012";
const LESSON = "01a0d0d8-0000-7000-8000-000000000013";

/*
  The authoring routes' HTTP contract: who may call them, what they accept,
  and the envelope. CurriculumService is stubbed; its rules have their own spec.
*/
describe("Authoring — modules and lessons (e2e)", () => {
  let app: INestApplication;
  let signAccessToken: (claims: object) => Promise<string>;
  const curriculum = {
    listPathways: fn(),
    getPathway: fn(),
    createModule: fn(),
    getModule: fn(),
    updateModule: fn(),
    moveModule: fn(),
    publishModule: fn(),
    unpublishModule: fn(),
    archiveModule: fn(),
    restoreModule: fn(),
    createLesson: fn(),
    getLesson: fn(),
    updateLesson: fn(),
    moveLesson: fn(),
    publishLesson: fn(),
    unpublishLesson: fn(),
    archiveLesson: fn(),
    restoreLesson: fn(),
  };

  beforeAll(async () => {
    ({ app, signAccessToken } = await createTestApp({
      imports: [AuthoringModule],
      overrides: [{ provide: CurriculumService, useValue: curriculum }],
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const server = () => app.getHttpServer();
  const as = async (platformRole: string) =>
    `Bearer ${await signAccessToken({ platformRole, institutionId: null, institutionRole: null })}`;

  describe("who may call them", () => {
    it("lets a content manager in", async () => {
      curriculum.listPathways.mockResolvedValue([]);

      const response = await request(server())
        .get("/api/authoring/pathways")
        .set("authorization", await as("CONTENT_MANAGER"))
        .expect(200);

      expect(asSuccess(response.body)).toMatchObject({ success: true, message: "Pathways loaded" });
    });

    it("turns away someone who is not on the content team", async () => {
      const response = await request(server())
        .get("/api/authoring/pathways")
        .set("authorization", await as("NONE"))
        .expect(403);

      expect(asFailure(response.body).error.code).toBe("INSUFFICIENT_ROLE");
      expect(curriculum.listPathways).not.toHaveBeenCalled();
    });

    it("needs a session", async () => {
      await request(server()).get("/api/authoring/pathways").expect(401);
    });
  });

  describe("adding a module", () => {
    it("answers 201 with the new module", async () => {
      curriculum.createModule.mockResolvedValue({ id: MODULE, title: "Enterprise Mindset" });

      const response = await request(server())
        .post(`/api/authoring/pathways/${PATHWAY}/modules`)
        .set("authorization", await as("PLATFORM_ADMIN"))
        .send({ title: "  Enterprise Mindset  " })
        .expect(201);

      expect(asSuccess(response.body).message).toBe("Module added");
      // Trimmed before it reaches the service.
      expect(curriculum.createModule).toHaveBeenCalledWith(expect.anything(), PATHWAY, {
        title: "Enterprise Mindset",
      });
    });

    it("refuses a title of nothing but spaces", async () => {
      const response = await request(server())
        .post(`/api/authoring/pathways/${PATHWAY}/modules`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send({ title: "   " })
        .expect(400);

      expect(asFailure(response.body).error.code).toBe("VALIDATION_FAILED");
    });

    it("refuses fields it does not know, such as a status", async () => {
      await request(server())
        .post(`/api/authoring/pathways/${PATHWAY}/modules`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send({ title: "Markets", status: "PUBLISHED" })
        .expect(400);

      expect(curriculum.createModule).not.toHaveBeenCalled();
    });
  });

  describe("editing and moving", () => {
    it("passes a cleared summary through as null", async () => {
      curriculum.updateLesson.mockResolvedValue({ id: LESSON });

      await request(server())
        .patch(`/api/authoring/lessons/${LESSON}`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send({ summary: null })
        .expect(200);

      expect(curriculum.updateLesson).toHaveBeenCalledWith(expect.anything(), LESSON, {
        summary: null,
      });
    });

    it("refuses a title set to null, since a title cannot be cleared", async () => {
      await request(server())
        .patch(`/api/authoring/lessons/${LESSON}`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send({ title: null })
        .expect(400);
    });

    it("moves up or down, and nothing else", async () => {
      curriculum.moveModule.mockResolvedValue({ id: MODULE });

      await request(server())
        .post(`/api/authoring/modules/${MODULE}/move`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send({ direction: "UP" })
        .expect(200);
      await request(server())
        .post(`/api/authoring/modules/${MODULE}/move`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send({ direction: "LEFT" })
        .expect(400);

      expect(curriculum.moveModule).toHaveBeenCalledTimes(1);
    });

    it("refuses an id that is not a uuid before reaching the service", async () => {
      await request(server())
        .get("/api/authoring/lessons/not-an-id")
        .set("authorization", await as("CONTENT_MANAGER"))
        .expect(400);

      expect(curriculum.getLesson).not.toHaveBeenCalled();
    });
  });

  describe("publishing", () => {
    it("answers 200 with the lesson", async () => {
      curriculum.publishLesson.mockResolvedValue({ id: LESSON, status: "PUBLISHED" });

      const response = await request(server())
        .post(`/api/authoring/lessons/${LESSON}/publish`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .expect(200);

      expect(asSuccess(response.body)).toMatchObject({
        message: "Lesson published",
        data: { status: "PUBLISHED" },
      });
    });

    it("passes a refusal through with its code and sentence", async () => {
      curriculum.publishLesson.mockRejectedValue(
        new BadRequestException({
          code: "LESSON_INCOMPLETE",
          message: "Finish “Four flows” before publishing this lesson.",
        }),
      );

      const response = await request(server())
        .post(`/api/authoring/lessons/${LESSON}/publish`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .expect(400);

      expect(asFailure(response.body).error).toMatchObject({
        code: "LESSON_INCOMPLETE",
        message: "Finish “Four flows” before publishing this lesson.",
      });
    });
  });
});
