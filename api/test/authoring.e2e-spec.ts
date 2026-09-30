import { jest } from "@jest/globals";
import { BadRequestException, type INestApplication } from "@nestjs/common";
import request from "supertest";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../src/common/http/api-response.js";
import { AuthoringModule } from "../src/modules/authoring/authoring.module.js";
import { CurriculumService } from "../src/modules/authoring/curriculum.service.js";
import { ScenesService } from "../src/modules/authoring/scenes.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asSuccess = <T>(body: unknown) => body as ApiSuccessResponse<T>;
const asFailure = (body: unknown) => body as ApiErrorResponse;

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const PATHWAY = "01a0d0d8-0000-7000-8000-000000000011";
const MODULE = "01a0d0d8-0000-7000-8000-000000000012";
const LESSON = "01a0d0d8-0000-7000-8000-000000000013";
const SCENE = "01a0d0d8-0000-7000-8000-000000000014";
const ASSET = "01a0d0d8-0000-7000-8000-000000000015";

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

  const scenes = {
    createScene: fn(),
    getScene: fn(),
    updateScene: fn(),
    moveScene: fn(),
    removeScene: fn(),
    requestUpload: fn(),
    completeUpload: fn(),
  };

  beforeAll(async () => {
    ({ app, signAccessToken } = await createTestApp({
      imports: [AuthoringModule],
      overrides: [
        { provide: CurriculumService, useValue: curriculum },
        { provide: ScenesService, useValue: scenes },
      ],
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

  describe("scenes", () => {
    it("adds a video or notes scene, and nothing else", async () => {
      scenes.createScene.mockResolvedValue({ id: SCENE });

      await request(server())
        .post(`/api/authoring/lessons/${LESSON}/scenes`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send({ kind: "VIDEO", title: "Four flows" })
        .expect(201);
      await request(server())
        .post(`/api/authoring/lessons/${LESSON}/scenes`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send({ kind: "QUIZ", title: "Not yet" })
        .expect(400);

      expect(scenes.createScene).toHaveBeenCalledTimes(1);
    });

    it("removes a scene with DELETE", async () => {
      scenes.removeScene.mockResolvedValue({ id: SCENE });

      const response = await request(server())
        .delete(`/api/authoring/scenes/${SCENE}`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .expect(200);

      expect(asSuccess(response.body)).toMatchObject({ message: "Scene removed", data: { id: SCENE } });
    });
  });

  describe("uploads", () => {
    const upload = { purpose: "VIDEO", fileName: "four-flows.mp4", contentType: "video/mp4", sizeBytes: 4096 };

    it("answers 201 with where to send the file", async () => {
      scenes.requestUpload.mockResolvedValue({
        assetId: ASSET,
        url: "https://storage.example/put",
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        expiresAt: "2026-09-30T10:15:00.000Z",
      });

      const response = await request(server())
        .post(`/api/authoring/scenes/${SCENE}/uploads`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send(upload)
        .expect(201);

      expect(asSuccess(response.body)).toMatchObject({
        message: "Upload ready",
        data: { assetId: ASSET, method: "PUT" },
      });
    });

    it("refuses a size that is not a whole, positive number", async () => {
      // A string of digits is read as its number, as for every numeric field.
      for (const sizeBytes of [0, -1, 1.5, "a lot"]) {
        await request(server())
          .post(`/api/authoring/scenes/${SCENE}/uploads`)
          .set("authorization", await as("CONTENT_MANAGER"))
          .send({ ...upload, sizeBytes })
          .expect(400);
      }

      expect(scenes.requestUpload).not.toHaveBeenCalled();
    });

    it("refuses a purpose it does not know", async () => {
      await request(server())
        .post(`/api/authoring/scenes/${SCENE}/uploads`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .send({ ...upload, purpose: "THUMBNAIL" })
        .expect(400);
    });

    it("finishes an upload, and passes a refusal through with its code", async () => {
      scenes.completeUpload.mockRejectedValueOnce(
        new BadRequestException({ code: "CAPTIONS_INVALID", message: "That is not WebVTT." }),
      );

      const response = await request(server())
        .post(`/api/authoring/uploads/${ASSET}/complete`)
        .set("authorization", await as("CONTENT_MANAGER"))
        .expect(400);

      expect(asFailure(response.body).error.code).toBe("CAPTIONS_INVALID");
    });

    it("keeps uploads to the content team", async () => {
      await request(server())
        .post(`/api/authoring/scenes/${SCENE}/uploads`)
        .set("authorization", await as("NONE"))
        .send(upload)
        .expect(403);
    });
  });
});
