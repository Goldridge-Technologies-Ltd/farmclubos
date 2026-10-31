import { jest } from "@jest/globals";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { StorageService } from "../../lib/storage/storage.service.js";
import { ContentAccessService } from "./content-access.service.js";
import { ScenesService } from "./scenes.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const author: AuthenticatedUser = {
  userId: "writer-1",
  sessionId: "session-1",
  email: "writer@example.com",
  platformRole: "CONTENT_MANAGER",
  institutionId: null,
  institutionRole: null,
};

const asset = (overrides: Record<string, unknown> = {}) => ({
  id: "asset-1",
  sceneId: "scene-1",
  purpose: "VIDEO",
  status: "PENDING",
  storageKey: "lessons/lesson-1/scenes/scene-1/video/new.mp4",
  fileName: "four-flows.mp4",
  contentType: "video/mp4",
  sizeBytes: 4096,
  readyAt: null,
  ...overrides,
});

const sceneRow = (overrides: Record<string, unknown> = {}) => ({
  id: "scene-1",
  lessonId: "lesson-1",
  kind: "VIDEO",
  sequence: 1,
  title: "Four flows",
  body: null,
  transcript: null,
  videoAssetId: null,
  captionsAssetId: null,
  posterAssetId: null,
  video: null,
  captions: null,
  poster: null,
  lesson: {
    id: "lesson-1",
    title: "Agriculture as a commercial system",
    status: "DRAFT",
    kind: "TEXT",
    module: {
      id: "module-1",
      title: "Enterprise Mindset",
      pathway: { id: "pathway-1", slug: "foundation", title: "Foundation" },
    },
  },
  ...overrides,
});

describe("ScenesService", () => {
  let service: ScenesService;
  let access: { assertCanAuthor: AsyncMock };
  let storage: {
    signUpload: AsyncMock;
    signDownload: AsyncMock;
    inspect: AsyncMock;
    readText: AsyncMock;
    remove: AsyncMock;
  };
  let prisma: {
    lesson: { findUnique: AsyncMock; update: AsyncMock };
    lessonScene: {
      findUnique: AsyncMock;
      findMany: AsyncMock;
      create: AsyncMock;
      update: AsyncMock;
      delete: AsyncMock;
      count: AsyncMock;
    };
    mediaAsset: {
      findUnique: AsyncMock;
      findMany: AsyncMock;
      create: AsyncMock;
      update: AsyncMock;
      delete: AsyncMock;
      deleteMany: AsyncMock;
    };
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    access = { assertCanAuthor: fn() };
    storage = {
      signUpload: fn(),
      signDownload: fn(),
      inspect: fn(),
      readText: fn(),
      remove: fn(),
    };
    prisma = {
      lesson: { findUnique: fn(), update: fn() },
      lessonScene: {
        findUnique: fn(),
        findMany: fn(),
        create: fn(),
        update: fn(),
        delete: fn(),
        count: fn(),
      },
      mediaAsset: {
        findUnique: fn(),
        findMany: fn(),
        create: fn(),
        update: fn(),
        delete: fn(),
        deleteMany: fn(),
      },
      auditEvent: { create: fn() },
      $transaction: jest.fn(async (work: unknown) =>
        (work as (client: typeof prisma) => Promise<unknown>)(prisma),
      ),
    };

    access.assertCanAuthor.mockResolvedValue(undefined);
    storage.signDownload.mockImplementation((key: unknown) =>
      Promise.resolve(`https://storage.example/${String(key)}?signed`),
    );
    storage.remove.mockResolvedValue(undefined);
    prisma.lessonScene.findUnique.mockResolvedValue(sceneRow());
    prisma.lessonScene.findMany.mockResolvedValue([]);
    prisma.lessonScene.count.mockResolvedValue(0);
    prisma.mediaAsset.findMany.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ScenesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ContentAccessService, useValue: access },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = moduleRef.get(ScenesService);
  });

  const auditActions = () =>
    (prisma.auditEvent.create.mock.calls as [{ data: { action: string } }][]).map(
      ([args]) => args.data.action,
    );

  describe("createScene", () => {
    beforeEach(() => {
      prisma.lesson.findUnique.mockResolvedValue({ id: "lesson-1", kind: "TEXT" });
      prisma.lessonScene.findMany.mockResolvedValue([{ sequence: 1 }, { sequence: 2 }]);
      prisma.lessonScene.create.mockResolvedValue({ id: "scene-3" });
    });

    it("adds a scene at the end of its lesson", async () => {
      await service.createScene(author, "lesson-1", { kind: "NOTES", title: "Lesson notes" });

      const [args] = prisma.lessonScene.create.mock.calls[0] as [{ data: object }];
      expect(args.data).toEqual({
        lessonId: "lesson-1",
        kind: "NOTES",
        title: "Lesson notes",
        sequence: 3,
      });
      expect(auditActions()).toEqual(["scene.created"]);
    });

    it("makes the lesson a video lesson once it has a video scene", async () => {
      prisma.lessonScene.count.mockResolvedValue(1);

      await service.createScene(author, "lesson-1", { kind: "VIDEO", title: "Four flows" });

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: "lesson-1" },
        data: { kind: "VIDEO" },
      });
    });

    it("is a 404 for a lesson that does not exist", async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.createScene(author, "lesson-9", { kind: "NOTES", title: "Notes" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("updateScene", () => {
    it("stores notes left empty as none, so the scene counts as unfinished", async () => {
      prisma.lessonScene.findUnique.mockResolvedValue(sceneRow({ kind: "NOTES", body: "Old notes" }));

      await service.updateScene(author, "scene-1", { body: "   " });

      const [args] = prisma.lessonScene.update.mock.calls[0] as [{ data: object }];
      expect(args.data).toEqual({ body: null });
    });

    it("writes and records nothing when nothing changed", async () => {
      prisma.lessonScene.findUnique.mockResolvedValue(sceneRow({ body: "Same" }));

      await service.updateScene(author, "scene-1", { title: "Four flows", body: "Same" });

      expect(prisma.lessonScene.update).not.toHaveBeenCalled();
      expect(prisma.auditEvent.create).not.toHaveBeenCalled();
    });
  });

  describe("removeScene", () => {
    it("deletes its files from storage, then the scene", async () => {
      prisma.mediaAsset.findMany.mockResolvedValue([
        { storageKey: "lessons/lesson-1/scenes/scene-1/video/a.mp4" },
        { storageKey: "lessons/lesson-1/scenes/scene-1/captions/b.vtt" },
      ]);
      prisma.lesson.findUnique.mockResolvedValue({ id: "lesson-1", kind: "VIDEO" });

      await service.removeScene(author, "scene-1");

      expect(storage.remove).toHaveBeenCalledWith("lessons/lesson-1/scenes/scene-1/video/a.mp4");
      expect(storage.remove).toHaveBeenCalledWith("lessons/lesson-1/scenes/scene-1/captions/b.vtt");
      expect(prisma.lessonScene.delete).toHaveBeenCalledWith({ where: { id: "scene-1" } });
      expect(auditActions()).toEqual(["scene.removed"]);
    });

    it("makes a lesson with no video scene left a text lesson again", async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: "lesson-1", kind: "VIDEO" });
      prisma.lessonScene.count.mockResolvedValue(0);

      await service.removeScene(author, "scene-1");

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: "lesson-1" },
        data: { kind: "TEXT" },
      });
    });
  });

  describe("requestUpload", () => {
    const video = { purpose: "VIDEO" as const, fileName: "four-flows.mp4", contentType: "video/mp4", sizeBytes: 4096 };

    beforeEach(() => {
      prisma.mediaAsset.create.mockImplementation((args: unknown) =>
        Promise.resolve({ id: "asset-1", ...(args as { data: object }).data }),
      );
      storage.signUpload.mockResolvedValue({
        url: "https://storage.example/put?signed",
        headers: { "Content-Type": "video/mp4" },
        expiresAt: new Date("2026-09-30T10:15:00Z"),
      });
    });

    it("signs an upload straight to storage, under a key of its own making", async () => {
      const ticket = await service.requestUpload(author, "scene-1", {
        ...video,
        fileName: "../../../other-lesson.mp4",
      });

      const [args] = prisma.mediaAsset.create.mock.calls[0] as [
        { data: { storageKey: string; status: string; fileName: string; uploadedById: string } },
      ];
      // The uploaded name is only shown to the content team, never used as a path.
      expect(args.data.storageKey).toMatch(/^lessons\/lesson-1\/scenes\/scene-1\/video\/[0-9a-f-]{36}\.mp4$/);
      expect(args.data).toMatchObject({ status: "PENDING", uploadedById: "writer-1" });
      expect(storage.signUpload).toHaveBeenCalledWith(args.data.storageKey, "video/mp4", 4096);
      expect(ticket).toEqual({
        assetId: "asset-1",
        url: "https://storage.example/put?signed",
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        expiresAt: new Date("2026-09-30T10:15:00Z"),
      });
    });

    it("clears an earlier upload to the same slot that never finished", async () => {
      prisma.mediaAsset.findMany.mockResolvedValue([{ id: "stale", storageKey: "lessons/x/stale.mp4" }]);

      await service.requestUpload(author, "scene-1", video);

      const [query] = prisma.mediaAsset.findMany.mock.calls[0] as [{ where: object }];
      expect(query.where).toEqual({ sceneId: "scene-1", purpose: "VIDEO", status: "PENDING" });
      expect(storage.remove).toHaveBeenCalledWith("lessons/x/stale.mp4");
      expect(prisma.mediaAsset.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["stale"] } } });
    });

    it("refuses a file on a notes scene, which has none", async () => {
      prisma.lessonScene.findUnique.mockResolvedValue(sceneRow({ kind: "NOTES" }));

      await expect(service.requestUpload(author, "scene-1", video)).rejects.toMatchObject({
        response: { code: "WRONG_SCENE_KIND" },
      });
    });

    it("refuses a type the slot does not take, saying what it does", async () => {
      await expect(
        service.requestUpload(author, "scene-1", { ...video, contentType: "video/quicktime" }),
      ).rejects.toMatchObject({
        response: { code: "FILE_TYPE", message: expect.stringContaining("an MP4 video") },
      });
    });

    it("refuses a file over the slot's limit", async () => {
      await expect(
        service.requestUpload(author, "scene-1", {
          purpose: "CAPTIONS",
          fileName: "huge.vtt",
          contentType: "text/vtt",
          sizeBytes: 2 * 1024 * 1024,
        }),
      ).rejects.toMatchObject({ response: { code: "FILE_TOO_LARGE" } });
      expect(storage.signUpload).not.toHaveBeenCalled();
    });
  });

  describe("completeUpload", () => {
    beforeEach(() => {
      prisma.mediaAsset.findUnique.mockResolvedValue(asset());
      prisma.mediaAsset.update.mockResolvedValue(asset({ status: "READY" }));
    });

    it("refuses when nothing arrived, and forgets the upload", async () => {
      storage.inspect.mockResolvedValue(null);

      await expect(service.completeUpload(author, "asset-1")).rejects.toMatchObject({
        response: { code: "UPLOAD_MISSING" },
      });
      expect(prisma.mediaAsset.delete).toHaveBeenCalledWith({ where: { id: "asset-1" } });
    });

    it("refuses a file that is not what was signed for, and deletes it", async () => {
      storage.inspect.mockResolvedValue({ sizeBytes: 9999, contentType: "video/mp4" });

      await expect(service.completeUpload(author, "asset-1")).rejects.toMatchObject({
        response: { code: "UPLOAD_MISMATCH" },
      });
      expect(storage.remove).toHaveBeenCalledWith("lessons/lesson-1/scenes/scene-1/video/new.mp4");
      expect(prisma.mediaAsset.delete).toHaveBeenCalledWith({ where: { id: "asset-1" } });
    });

    it("refuses captions that are not WebVTT", async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(
        asset({ purpose: "CAPTIONS", contentType: "text/vtt", sizeBytes: 20, storageKey: "k.vtt" }),
      );
      storage.inspect.mockResolvedValue({ sizeBytes: 20, contentType: "text/vtt" });
      storage.readText.mockResolvedValue("1\n00:00:00,000 --> 00:00:01,000\nSRT\n");

      await expect(service.completeUpload(author, "asset-1")).rejects.toMatchObject({
        response: { code: "CAPTIONS_INVALID" },
      });
      expect(storage.remove).toHaveBeenCalledWith("k.vtt");
    });

    it("attaches a checked video to its scene, and removes the one it replaces", async () => {
      storage.inspect.mockResolvedValue({ sizeBytes: 4096, contentType: "video/mp4" });
      prisma.lessonScene.findUnique.mockResolvedValue(
        sceneRow({
          videoAssetId: "old",
          video: asset({ id: "old", status: "READY", storageKey: "lessons/old.mp4" }),
        }),
      );

      await service.completeUpload(author, "asset-1");

      expect(prisma.mediaAsset.update).toHaveBeenCalledWith({
        where: { id: "asset-1" },
        data: { status: "READY", readyAt: expect.any(Date) },
      });
      expect(prisma.lessonScene.update).toHaveBeenCalledWith({
        where: { id: "scene-1" },
        data: { videoAssetId: "asset-1" },
      });
      expect(prisma.mediaAsset.delete).toHaveBeenCalledWith({ where: { id: "old" } });
      expect(storage.remove).toHaveBeenCalledWith("lessons/old.mp4");
      expect(auditActions()).toEqual(["scene.file_uploaded"]);
    });

    it("makes the transcript from captions as it attaches them", async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(
        asset({ purpose: "CAPTIONS", contentType: "text/vtt", sizeBytes: 40, storageKey: "c.vtt" }),
      );
      storage.inspect.mockResolvedValue({ sizeBytes: 40, contentType: "text/vtt" });
      storage.readText.mockResolvedValue("WEBVTT\n\n00:00.000 --> 00:02.000\nFollow the value.\n");

      await service.completeUpload(author, "asset-1");

      expect(prisma.lessonScene.update).toHaveBeenCalledWith({
        where: { id: "scene-1" },
        data: { captionsAssetId: "asset-1", transcript: "Follow the value." },
      });
    });

    it("treats finishing an upload twice as done", async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(asset({ status: "READY" }));

      await service.completeUpload(author, "asset-1");

      expect(storage.inspect).not.toHaveBeenCalled();
      expect(prisma.lessonScene.update).not.toHaveBeenCalled();
    });
  });

  describe("getScene", () => {
    it("gives a signed link for each file it has, and says what is missing", async () => {
      prisma.lessonScene.findUnique.mockResolvedValue(
        sceneRow({
          videoAssetId: "asset-1",
          video: asset({ status: "READY", readyAt: new Date("2026-09-30T09:00:00Z") }),
        }),
      );

      const scene = await service.getScene(author, "scene-1");

      expect(scene.video).toMatchObject({
        fileName: "four-flows.mp4",
        url: "https://storage.example/lessons/lesson-1/scenes/scene-1/video/new.mp4?signed",
      });
      // Captions are optional, so only the still image is missing.
      expect(scene.captions).toBeNull();
      expect(scene.gaps).toEqual(["POSTER"]);
      expect(scene.pathway).toEqual({ id: "pathway-1", slug: "foundation", title: "Foundation" });
    });
  });

  describe("previewLesson", () => {
    const file = (storageKey: string, contentType = "video/mp4") => ({ storageKey, contentType });
    const previewScene = (overrides: Record<string, unknown> = {}) => ({
      id: "scene-1",
      kind: "VIDEO",
      title: "Four flows",
      body: null,
      transcript: null,
      videoAssetId: null,
      captionsAssetId: null,
      posterAssetId: null,
      video: null,
      captions: null,
      poster: null,
      ...overrides,
    });
    const lessonRow = (scenes: unknown[]) => ({
      id: "lesson-1",
      title: "Agriculture as a commercial system",
      summary: "Why a farm is a business.",
      kind: "VIDEO",
      status: "DRAFT",
      archivedAt: null,
      module: {
        id: "module-1",
        title: "Enterprise Mindset",
        pathway: { id: "pathway-1", slug: "foundation", title: "Foundation" },
      },
      scenes,
    });

    it("gives every scene in order, each with what it still needs, for the content team only", async () => {
      prisma.lesson.findUnique.mockResolvedValue(
        lessonRow([
          previewScene({
            body: "What the four flows are.",
            transcript: "Every farm runs on four flows.",
            videoAssetId: "asset-1",
            captionsAssetId: "asset-2",
            posterAssetId: "asset-3",
            video: file("lessons/lesson-1/scenes/scene-1/video/a.mp4"),
            captions: file("lessons/lesson-1/scenes/scene-1/captions/b.vtt", "text/vtt"),
            poster: file("lessons/lesson-1/scenes/scene-1/poster/c.jpg", "image/jpeg"),
          }),
          previewScene({ id: "scene-2", kind: "NOTES", title: "Lesson notes", body: "Read this." }),
        ]),
      );

      const preview = await service.previewLesson(author, "lesson-1");

      expect(access.assertCanAuthor).toHaveBeenCalledWith(author);
      const [args] = prisma.lesson.findUnique.mock.calls[0] as [
        { where: object; select: { scenes: { orderBy: object } } },
      ];
      expect(args.where).toEqual({ id: "lesson-1" });
      expect(args.select.scenes.orderBy).toEqual({ sequence: "asc" });
      expect(preview).toMatchObject({
        id: "lesson-1",
        title: "Agriculture as a commercial system",
        summary: "Why a farm is a business.",
        status: "DRAFT",
        archivedAt: null,
        module: { id: "module-1", title: "Enterprise Mindset" },
        pathway: { id: "pathway-1", slug: "foundation", title: "Foundation" },
      });
      expect(preview.scenes).toEqual([
        {
          id: "scene-1",
          kind: "VIDEO",
          title: "Four flows",
          body: "What the four flows are.",
          transcript: "Every farm runs on four flows.",
          video: {
            url: "https://storage.example/lessons/lesson-1/scenes/scene-1/video/a.mp4?signed",
            contentType: "video/mp4",
            captionsUrl: "https://storage.example/lessons/lesson-1/scenes/scene-1/captions/b.vtt?signed",
            posterUrl: "https://storage.example/lessons/lesson-1/scenes/scene-1/poster/c.jpg?signed",
          },
          gaps: [],
        },
        {
          id: "scene-2",
          kind: "NOTES",
          title: "Lesson notes",
          body: "Read this.",
          transcript: null,
          video: null,
          gaps: [],
        },
      ]);
    });

    it("keeps scenes learners would not see yet, and plays a video before its still image is added", async () => {
      prisma.lesson.findUnique.mockResolvedValue(
        lessonRow([
          previewScene({
            videoAssetId: "asset-1",
            video: file("lessons/lesson-1/scenes/scene-1/video/a.mp4"),
          }),
          previewScene({ id: "scene-2", title: "Still to film" }),
          previewScene({ id: "scene-3", kind: "NOTES", title: "Notes to write" }),
        ]),
      );

      const preview = await service.previewLesson(author, "lesson-1");

      expect(preview.scenes.map((scene) => [scene.id, scene.gaps])).toEqual([
        ["scene-1", ["POSTER"]],
        ["scene-2", ["VIDEO", "POSTER"]],
        ["scene-3", ["BODY"]],
      ]);
      expect(preview.scenes[0].video).toEqual({
        url: "https://storage.example/lessons/lesson-1/scenes/scene-1/video/a.mp4?signed",
        contentType: "video/mp4",
        captionsUrl: null,
        posterUrl: null,
      });
      expect(preview.scenes[1].video).toBeNull();
    });

    it("is a 404 for a lesson that does not exist", async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.previewLesson(author, "lesson-9")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("looks nothing up for someone the content team has since let go", async () => {
      access.assertCanAuthor.mockRejectedValue(new ForbiddenException());

      await expect(service.previewLesson(author, "lesson-1")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.lesson.findUnique).not.toHaveBeenCalled();
    });
  });
});
