import { jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { ProgressService } from "../progress/progress.service.js";
import { ContentAccessService } from "./content-access.service.js";
import { CurriculumService } from "./curriculum.service.js";

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

const pathwayRow = (overrides: Record<string, unknown> = {}) => ({
  id: "pathway-1",
  slug: "agricultural-entrepreneurship-foundation",
  title: "Agricultural Entrepreneurship Foundation",
  summary: "From growing crops to running an agricultural enterprise.",
  description: null,
  level: "FOUNDATION",
  sequence: 1,
  status: "DRAFT",
  publishedAt: null,
  archivedAt: null,
  modules: [],
  ...overrides,
});

const moduleRow = (overrides: Record<string, unknown> = {}) => ({
  id: "module-1",
  pathwayId: "pathway-1",
  slug: "enterprise-mindset",
  title: "Enterprise Mindset",
  summary: null,
  sequence: 1,
  status: "DRAFT",
  publishedAt: null,
  archivedAt: null,
  lessons: [],
  ...overrides,
});

const lessonRow = (overrides: Record<string, unknown> = {}) => ({
  id: "lesson-1",
  moduleId: "module-1",
  slug: "farming-activity-vs-enterprise",
  title: "Farming Activity vs Enterprise",
  summary: null,
  sequence: 1,
  status: "DRAFT",
  publishedAt: null,
  archivedAt: null,
  kind: "TEXT",
  authoringStatus: "PLACEHOLDER",
  module: { id: "module-1", pathwayId: "pathway-1" },
  scenes: [],
  ...overrides,
});

const videoScene = (overrides: Record<string, unknown> = {}) => ({
  id: "scene-1",
  kind: "VIDEO",
  sequence: 1,
  title: "Production is necessary",
  body: null,
  videoAssetId: "v",
  captionsAssetId: "c",
  posterAssetId: "p",
  ...overrides,
});

describe("CurriculumService", () => {
  let service: CurriculumService;
  let access: { assertCanAuthor: AsyncMock };
  let progress: { recomputePathway: AsyncMock };
  let prisma: {
    pathway: { findMany: AsyncMock; findUnique: AsyncMock; create: AsyncMock; update: AsyncMock };
    enrolment: { count: AsyncMock };
    pathwayModule: { findMany: AsyncMock; findUnique: AsyncMock; create: AsyncMock; update: AsyncMock };
    lesson: { findMany: AsyncMock; findUnique: AsyncMock; create: AsyncMock; update: AsyncMock };
    lessonScene: { groupBy: AsyncMock };
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    access = { assertCanAuthor: fn() };
    progress = { recomputePathway: fn() };
    prisma = {
      pathway: { findMany: fn(), findUnique: fn(), create: fn(), update: fn() },
      enrolment: { count: fn() },
      pathwayModule: { findMany: fn(), findUnique: fn(), create: fn(), update: fn() },
      lesson: { findMany: fn(), findUnique: fn(), create: fn(), update: fn() },
      lessonScene: { groupBy: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn(async (work: unknown) =>
        Array.isArray(work)
          ? Promise.all(work)
          : (work as (client: typeof prisma) => Promise<unknown>)(prisma),
      ),
    };

    access.assertCanAuthor.mockResolvedValue(undefined);
    progress.recomputePathway.mockResolvedValue(undefined);
    prisma.lessonScene.groupBy.mockResolvedValue([]);
    prisma.pathway.create.mockResolvedValue(pathwayRow());
    prisma.pathway.update.mockResolvedValue(pathwayRow());
    prisma.enrolment.count.mockResolvedValue(0);
    prisma.pathwayModule.update.mockResolvedValue(moduleRow());
    prisma.lesson.update.mockResolvedValue(lessonRow());

    const moduleRef = await Test.createTestingModule({
      providers: [
        CurriculumService,
        { provide: PrismaService, useValue: prisma },
        { provide: ContentAccessService, useValue: access },
        { provide: ProgressService, useValue: progress },
      ],
    }).compile();

    service = moduleRef.get(CurriculumService);
  });

  const auditActions = () =>
    (prisma.auditEvent.create.mock.calls as [{ data: { action: string } }][]).map(
      ([args]) => args.data.action,
    );

  it("checks the caller is on the content team before anything else", async () => {
    access.assertCanAuthor.mockRejectedValue(new Error("INSUFFICIENT_ROLE"));

    await expect(service.listPathways(author)).rejects.toThrow("INSUFFICIENT_ROLE");
    expect(prisma.pathway.findMany).not.toHaveBeenCalled();
  });

  describe("listPathways", () => {
    it("counts modules that are not archived, and those published", async () => {
      prisma.pathway.findMany.mockResolvedValue([
        {
          id: "pathway-1",
          slug: "foundation",
          title: "Foundation",
          status: "PUBLISHED",
          modules: [
            { status: "PUBLISHED", archivedAt: null },
            { status: "DRAFT", archivedAt: null },
            { status: "DRAFT", archivedAt: new Date() },
          ],
        },
      ]);

      const [pathway] = await service.listPathways(author);

      expect(pathway).toMatchObject({ moduleCount: 2, publishedModuleCount: 1 });
    });

    it("includes archived pathways, since this list is the only way back to them", async () => {
      prisma.pathway.findMany.mockResolvedValue([pathwayRow({ archivedAt: new Date("2026-10-01") })]);

      const [pathway] = await service.listPathways(author);

      const [args] = prisma.pathway.findMany.mock.calls[0] as [{ where?: object }];
      expect(args.where).toBeUndefined();
      expect(pathway?.archivedAt).toEqual(new Date("2026-10-01"));
    });
  });

  describe("createPathway", () => {
    beforeEach(() => {
      prisma.pathway.findMany.mockResolvedValue([
        { slug: "agricultural-entrepreneurship-foundation", sequence: 1 },
        { slug: "greenhouse-enterprise", sequence: 3 },
      ]);
    });

    it("adds a draft at the end of the catalogue, with a slug from its title no pathway has", async () => {
      await service.createPathway(author, {
        title: "Greenhouse Enterprise",
        summary: "  Running a greenhouse as a business.  ",
      });

      const [args] = prisma.pathway.create.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({
        title: "Greenhouse Enterprise",
        slug: "greenhouse-enterprise-2",
        summary: "Running a greenhouse as a business.",
        description: null,
        level: "FOUNDATION",
        sequence: 4,
        status: "DRAFT",
      });
      expect(auditActions()).toEqual(["pathway.created"]);
    });

    it("takes the level and description it is given", async () => {
      await service.createPathway(author, {
        title: "Scaling an Agribusiness",
        summary: "For enterprises already trading.",
        description: "  Growth, finance and people.  ",
        level: "ADVANCED",
      });

      const [args] = prisma.pathway.create.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toMatchObject({ level: "ADVANCED", description: "Growth, finance and people." });
    });
  });

  describe("updatePathway", () => {
    it("moves a never-published pathway's slug with its title", async () => {
      prisma.pathway.findUnique.mockResolvedValue(pathwayRow());
      prisma.pathway.findMany.mockResolvedValue([{ slug: "greenhouse-enterprise" }]);

      await service.updatePathway(author, "pathway-1", { title: "Enterprise Foundation" });

      const [args] = prisma.pathway.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ title: "Enterprise Foundation", slug: "enterprise-foundation" });
      expect(auditActions()).toEqual(["pathway.updated"]);
    });

    it("keeps the slug of a pathway that has been published, so links keep working", async () => {
      prisma.pathway.findUnique.mockResolvedValue(pathwayRow({ publishedAt: new Date("2026-09-30") }));

      await service.updatePathway(author, "pathway-1", { title: "Enterprise Foundation" });

      const [args] = prisma.pathway.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ title: "Enterprise Foundation" });
    });

    it("changes only what differs: an empty description that was already empty is no change", async () => {
      prisma.pathway.findUnique.mockResolvedValue(pathwayRow());

      await service.updatePathway(author, "pathway-1", {
        summary: "A clearer summary.",
        description: "  ",
        level: "INTERMEDIATE",
      });

      const [args] = prisma.pathway.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ summary: "A clearer summary.", level: "INTERMEDIATE" });
    });

    it("writes and records nothing when nothing changed", async () => {
      prisma.pathway.findUnique.mockResolvedValue(pathwayRow());

      await service.updatePathway(author, "pathway-1", {
        title: "Agricultural Entrepreneurship Foundation",
        level: "FOUNDATION",
      });

      expect(prisma.pathway.update).not.toHaveBeenCalled();
      expect(prisma.auditEvent.create).not.toHaveBeenCalled();
    });

    it("is a 404 for a pathway that does not exist", async () => {
      prisma.pathway.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePathway(author, "pathway-9", { title: "Markets" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("movePathway", () => {
    beforeEach(() => {
      prisma.pathway.findUnique.mockResolvedValue(pathwayRow({ sequence: 2 }));
      prisma.pathway.findMany.mockResolvedValue([
        { id: "pathway-a", sequence: 1 },
        { id: "pathway-1", sequence: 2 },
      ]);
    });

    it("swaps a pathway with the one above it, among those not archived", async () => {
      await service.movePathway(author, "pathway-1", "UP");

      expect(prisma.pathway.update).toHaveBeenCalledWith({
        where: { id: "pathway-1" },
        data: { sequence: 1 },
      });
      expect(prisma.pathway.update).toHaveBeenCalledWith({
        where: { id: "pathway-a" },
        data: { sequence: 2 },
      });
      const [args] = prisma.pathway.findMany.mock.calls[0] as [{ where: object }];
      expect(args.where).toEqual({ archivedAt: null });
      expect(auditActions()).toEqual(["pathway.moved"]);
    });

    it("leaves the last pathway where it is when moved down", async () => {
      await service.movePathway(author, "pathway-1", "DOWN");

      expect(auditActions()).toEqual([]);
    });
  });

  describe("publishPathway", () => {
    it("refuses a pathway with no published module, which would show learners nothing", async () => {
      prisma.pathway.findUnique.mockResolvedValue(
        pathwayRow({ modules: [{ status: "DRAFT", archivedAt: null }] }),
      );

      await expect(service.publishPathway(author, "pathway-1")).rejects.toMatchObject({
        response: { code: "PATHWAY_EMPTY" },
      });
    });

    it("refuses an archived pathway until it is restored", async () => {
      prisma.pathway.findUnique.mockResolvedValue(
        pathwayRow({ archivedAt: new Date(), modules: [{ status: "PUBLISHED", archivedAt: null }] }),
      );

      await expect(service.publishPathway(author, "pathway-1")).rejects.toMatchObject({
        response: { code: "ARCHIVED" },
      });
    });

    it("publishes and dates the first publication", async () => {
      prisma.pathway.findUnique.mockResolvedValue(
        pathwayRow({ modules: [{ status: "PUBLISHED", archivedAt: null }] }),
      );

      await service.publishPathway(author, "pathway-1");

      const [args] = prisma.pathway.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ status: "PUBLISHED", publishedAt: expect.any(Date) });
      expect(auditActions()).toEqual(["pathway.published"]);
    });

    it("treats publishing a published pathway as done, not a second event", async () => {
      prisma.pathway.findUnique.mockResolvedValue(
        pathwayRow({ status: "PUBLISHED", modules: [{ status: "PUBLISHED", archivedAt: null }] }),
      );

      await service.publishPathway(author, "pathway-1");

      expect(prisma.pathway.update).not.toHaveBeenCalled();
      expect(auditActions()).toEqual([]);
    });
  });

  /*
    Taking a pathway away from learners — unpublishing or archiving it — hides
    every module and lesson beneath it, so it is refused while anyone is still
    working through it. A module can be withdrawn freely; that only shortens a
    pathway.
  */
  describe("unpublishPathway and archivePathway", () => {
    it.each(["unpublishPathway", "archivePathway"] as const)(
      "%s refuses while learners are part-way through the pathway",
      async (method) => {
        prisma.pathway.findUnique.mockResolvedValue(
          pathwayRow({ status: "PUBLISHED", publishedAt: new Date() }),
        );
        prisma.enrolment.count.mockResolvedValue(3);

        await expect(service[method](author, "pathway-1")).rejects.toMatchObject({
          response: { code: "PATHWAY_IN_USE" },
        });
        // An archived cohort's enrolments are gone from its learners and its
        // institution alike, and could never be withdrawn, so they don't count.
        expect(prisma.enrolment.count).toHaveBeenCalledWith({
          where: {
            status: { in: ["INVITED", "ACTIVE"] },
            cohort: { pathwayId: "pathway-1", archivedAt: null },
          },
        });
        expect(prisma.pathway.update).not.toHaveBeenCalled();
      },
    );

    it("unpublishes back to draft when nobody is part-way through", async () => {
      prisma.pathway.findUnique.mockResolvedValue(
        pathwayRow({ status: "PUBLISHED", publishedAt: new Date() }),
      );

      await service.unpublishPathway(author, "pathway-1");

      const [args] = prisma.pathway.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ status: "DRAFT" });
      expect(auditActions()).toEqual(["pathway.unpublished"]);
    });

    it("treats unpublishing a draft as done, without asking about learners", async () => {
      prisma.pathway.findUnique.mockResolvedValue(pathwayRow());

      await service.unpublishPathway(author, "pathway-1");

      expect(prisma.enrolment.count).not.toHaveBeenCalled();
      expect(prisma.pathway.update).not.toHaveBeenCalled();
    });

    it("archives a pathway back to draft", async () => {
      prisma.pathway.findUnique.mockResolvedValue(
        pathwayRow({ status: "PUBLISHED", publishedAt: new Date() }),
      );

      await service.archivePathway(author, "pathway-1");

      const [args] = prisma.pathway.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ archivedAt: expect.any(Date), status: "DRAFT" });
      expect(auditActions()).toEqual(["pathway.archived"]);
    });

    it("treats archiving an archived pathway as done", async () => {
      prisma.pathway.findUnique.mockResolvedValue(pathwayRow({ archivedAt: new Date() }));

      await service.archivePathway(author, "pathway-1");

      expect(prisma.pathway.update).not.toHaveBeenCalled();
    });
  });

  describe("restorePathway", () => {
    it("brings it back at the end of the catalogue, still a draft", async () => {
      prisma.pathway.findUnique.mockResolvedValue(pathwayRow({ archivedAt: new Date() }));
      prisma.pathway.findMany.mockResolvedValue([{ sequence: 1 }, { sequence: 2 }]);

      await service.restorePathway(author, "pathway-1");

      const [args] = prisma.pathway.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ archivedAt: null, sequence: 3 });
      expect(auditActions()).toEqual(["pathway.restored"]);
    });

    it("treats restoring a pathway that is not archived as done", async () => {
      prisma.pathway.findUnique.mockResolvedValue(pathwayRow());

      await service.restorePathway(author, "pathway-1");

      expect(prisma.pathway.update).not.toHaveBeenCalled();
    });
  });

  describe("createModule", () => {
    beforeEach(() => {
      prisma.pathway.findUnique.mockResolvedValue({ id: "pathway-1" });
      prisma.pathwayModule.findMany.mockResolvedValue([
        { slug: "enterprise-mindset", sequence: 1 },
        { slug: "markets", sequence: 7 },
      ]);
      prisma.pathwayModule.create.mockResolvedValue(moduleRow({ id: "module-9" }));
    });

    it("adds a draft at the end, with a slug from its title no sibling has", async () => {
      await service.createModule(author, "pathway-1", { title: "Enterprise Mindset" });

      const [args] = prisma.pathwayModule.create.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toMatchObject({
        pathwayId: "pathway-1",
        title: "Enterprise Mindset",
        slug: "enterprise-mindset-2",
        sequence: 8,
        status: "DRAFT",
      });
      expect(auditActions()).toEqual(["module.created"]);
    });

    it("stores an empty summary as none", async () => {
      await service.createModule(author, "pathway-1", { title: "Markets", summary: "   " });

      const [args] = prisma.pathwayModule.create.mock.calls[0] as [{ data: { summary: unknown } }];
      expect(args.data.summary).toBeNull();
    });

    it("is a 404 for a pathway that does not exist", async () => {
      prisma.pathway.findUnique.mockResolvedValue(null);

      await expect(
        service.createModule(author, "pathway-9", { title: "Markets" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("updateModule", () => {
    it("moves a never-published module's slug with its title", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(moduleRow());
      prisma.pathwayModule.findMany.mockResolvedValue([{ slug: "enterprise-mindset" }, { slug: "markets" }]);

      await service.updateModule(author, "module-1", { title: "Enterprise Thinking" });

      const [args] = prisma.pathwayModule.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ title: "Enterprise Thinking", slug: "enterprise-thinking" });
    });

    it("keeps the slug of a module that has been published, so links keep working", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(
        moduleRow({ status: "DRAFT", publishedAt: new Date("2026-09-01") }),
      );

      await service.updateModule(author, "module-1", { title: "Enterprise Thinking" });

      const [args] = prisma.pathwayModule.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ title: "Enterprise Thinking" });
    });

    it("writes and records nothing when nothing changed", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(moduleRow({ summary: "About value" }));

      await service.updateModule(author, "module-1", {
        title: "Enterprise Mindset",
        summary: "About value",
      });

      expect(prisma.pathwayModule.update).not.toHaveBeenCalled();
      expect(prisma.auditEvent.create).not.toHaveBeenCalled();
    });
  });

  describe("moveModule", () => {
    const siblings = [
      { id: "module-a", sequence: 1 },
      { id: "module-1", sequence: 2 },
      { id: "module-c", sequence: 3 },
    ];

    beforeEach(() => {
      prisma.pathwayModule.findUnique.mockResolvedValue(moduleRow({ sequence: 2 }));
      prisma.pathwayModule.findMany.mockResolvedValue(siblings);
    });

    it("swaps a module with the one above it", async () => {
      await service.moveModule(author, "module-1", "UP");

      expect(prisma.pathwayModule.update).toHaveBeenCalledWith({
        where: { id: "module-1" },
        data: { sequence: 1 },
      });
      expect(prisma.pathwayModule.update).toHaveBeenCalledWith({
        where: { id: "module-a" },
        data: { sequence: 2 },
      });
    });

    it("orders only what is not archived", async () => {
      await service.moveModule(author, "module-1", "DOWN");

      const [args] = prisma.pathwayModule.findMany.mock.calls[0] as [{ where: object }];
      expect(args.where).toEqual({ pathwayId: "pathway-1", archivedAt: null });
    });

    it("leaves the first module where it is when moved up", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(moduleRow({ id: "module-a", sequence: 1 }));

      await service.moveModule(author, "module-a", "UP");

      expect(auditActions()).toEqual([]);
    });
  });

  describe("publishModule", () => {
    it("refuses a module with no published lesson, which would show learners nothing", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(
        moduleRow({ lessons: [{ status: "DRAFT", archivedAt: null }] }),
      );

      await expect(service.publishModule(author, "module-1")).rejects.toMatchObject({
        response: { code: "MODULE_EMPTY" },
      });
    });

    it("publishes, dates the first publication, and recalculates the pathway's progress", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(
        moduleRow({ lessons: [{ status: "PUBLISHED", archivedAt: null }] }),
      );

      await service.publishModule(author, "module-1");

      const [args] = prisma.pathwayModule.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ status: "PUBLISHED", publishedAt: expect.any(Date) });
      expect(auditActions()).toEqual(["module.published"]);
      expect(progress.recomputePathway).toHaveBeenCalledWith("pathway-1");
    });

    it("keeps the date it was first published when published again", async () => {
      const first = new Date("2026-09-01");
      prisma.pathwayModule.findUnique.mockResolvedValue(
        moduleRow({ publishedAt: first, lessons: [{ status: "PUBLISHED", archivedAt: null }] }),
      );

      await service.publishModule(author, "module-1");

      const [args] = prisma.pathwayModule.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ status: "PUBLISHED", publishedAt: first });
    });

    it("treats publishing a published module as done, not a second event", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(
        moduleRow({ status: "PUBLISHED", lessons: [{ status: "PUBLISHED", archivedAt: null }] }),
      );

      await service.publishModule(author, "module-1");

      expect(prisma.pathwayModule.update).not.toHaveBeenCalled();
      expect(progress.recomputePathway).not.toHaveBeenCalled();
    });

    it("refuses an archived module until it is restored", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(moduleRow({ archivedAt: new Date() }));

      await expect(service.publishModule(author, "module-1")).rejects.toMatchObject({
        response: { code: "ARCHIVED" },
      });
    });
  });

  describe("archiveModule and restoreModule", () => {
    it("archives as a draft, so restoring never republishes by surprise", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(moduleRow({ status: "PUBLISHED" }));

      await service.archiveModule(author, "module-1");

      const [args] = prisma.pathwayModule.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ archivedAt: expect.any(Date), status: "DRAFT" });
      expect(progress.recomputePathway).toHaveBeenCalledWith("pathway-1");
    });

    it("restores to the end of the list, still a draft", async () => {
      prisma.pathwayModule.findUnique.mockResolvedValue(moduleRow({ archivedAt: new Date() }));
      prisma.pathwayModule.findMany.mockResolvedValue([{ sequence: 4 }, { sequence: 9 }]);

      await service.restoreModule(author, "module-1");

      const [args] = prisma.pathwayModule.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ archivedAt: null, sequence: 10 });
      expect(auditActions()).toEqual(["module.restored"]);
    });
  });

  describe("publishLesson", () => {
    it("refuses a lesson with no scenes", async () => {
      prisma.lesson.findUnique.mockResolvedValue(lessonRow());

      await expect(service.publishLesson(author, "lesson-1")).rejects.toMatchObject({
        response: { code: "LESSON_EMPTY" },
      });
    });

    it("refuses a lesson with an unfinished scene, and names it", async () => {
      prisma.lesson.findUnique.mockResolvedValue(
        lessonRow({
          scenes: [
            videoScene(),
            videoScene({ id: "scene-2", title: "Four flows", posterAssetId: null }),
          ],
        }),
      );

      const refusal = service.publishLesson(author, "lesson-1");

      await expect(refusal).rejects.toBeInstanceOf(BadRequestException);
      await expect(refusal).rejects.toMatchObject({
        response: { code: "LESSON_INCOMPLETE", message: expect.stringContaining("“Four flows”") },
      });
    });

    it("publishes a video scene without captions, which are optional", async () => {
      prisma.lesson.findUnique.mockResolvedValue(
        lessonRow({ scenes: [videoScene({ captionsAssetId: null })] }),
      );

      await service.publishLesson(author, "lesson-1");

      const [args] = prisma.lesson.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toMatchObject({ status: "PUBLISHED" });
    });

    it("publishes a complete lesson as authored, and recalculates progress for its module", async () => {
      prisma.lesson.findUnique.mockResolvedValue(lessonRow({ scenes: [videoScene()] }));

      await service.publishLesson(author, "lesson-1");

      const [args] = prisma.lesson.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({
        status: "PUBLISHED",
        publishedAt: expect.any(Date),
        authoringStatus: "AUTHORED",
      });
      expect(auditActions()).toEqual(["lesson.published"]);
      expect(progress.recomputePathway).toHaveBeenCalledWith("pathway-1", "module-1");
    });
  });

  describe("unpublishLesson", () => {
    it("takes it back to draft and recalculates progress", async () => {
      prisma.lesson.findUnique.mockResolvedValue(lessonRow({ status: "PUBLISHED" }));

      await service.unpublishLesson(author, "lesson-1");

      const [args] = prisma.lesson.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ status: "DRAFT" });
      expect(progress.recomputePathway).toHaveBeenCalledWith("pathway-1", "module-1");
    });
  });

  describe("getLesson", () => {
    it("lists its scenes in order, each with what it still needs", async () => {
      prisma.lesson.findUnique.mockResolvedValue(
        lessonRow({
          module: {
            id: "module-1",
            pathwayId: "pathway-1",
            slug: "enterprise-mindset",
            title: "Enterprise Mindset",
            status: "DRAFT",
            pathway: { id: "pathway-1", slug: "foundation", title: "Foundation" },
          },
          scenes: [
            videoScene(),
            videoScene({ id: "scene-2", title: "Notes", kind: "NOTES", videoAssetId: null, captionsAssetId: null, posterAssetId: null }),
          ],
        }),
      );

      const lesson = await service.getLesson(author, "lesson-1");

      expect(lesson.scenes).toEqual([
        { id: "scene-1", kind: "VIDEO", sequence: 1, title: "Production is necessary", gaps: [] },
        { id: "scene-2", kind: "NOTES", sequence: 1, title: "Notes", gaps: ["BODY"] },
      ]);
      expect(lesson).toMatchObject({ sceneCount: 2, readySceneCount: 1 });
    });

    it("is a 404 for a lesson that does not exist", async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.getLesson(author, "lesson-9")).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
