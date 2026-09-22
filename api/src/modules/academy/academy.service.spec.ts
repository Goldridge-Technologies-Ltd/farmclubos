import { jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { AcademyService } from "./academy.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const pathwayRow = (overrides: Record<string, unknown> = {}) => ({
  id: "pathway-1",
  slug: "agricultural-entrepreneurship-foundation",
  title: "Agricultural Entrepreneurship Foundation",
  summary: "Where every learner starts.",
  description: "Phase 1 flagship pathway.",
  level: "FOUNDATION",
  sequence: 1,
  _count: { modules: 7 },
  ...overrides,
});

const moduleRow = (overrides: Record<string, unknown> = {}) => ({
  id: "module-1",
  slug: "fundamentals-of-agriculture",
  title: "Fundamentals of Agriculture",
  summary: "The ground the rest is built on.",
  sequence: 1,
  _count: { lessons: 1, assessments: 1 },
  ...overrides,
});

const lessonRow = (overrides: Record<string, unknown> = {}) => ({
  id: "lesson-1",
  slug: "introduction",
  title: "Fundamentals of Agriculture",
  summary: "The ground the rest is built on.",
  body: null,
  kind: "TEXT",
  authoringStatus: "PLACEHOLDER",
  durationMinutes: null,
  sequence: 1,
  ...overrides,
});

describe("AcademyService", () => {
  let service: AcademyService;
  let prisma: {
    pathway: { findMany: AsyncMock; findFirst: AsyncMock };
    pathwayModule: { findFirst: AsyncMock };
    lesson: { findFirst: AsyncMock; findMany: AsyncMock };
  };

  beforeEach(async () => {
    prisma = {
      pathway: { findMany: fn(), findFirst: fn() },
      pathwayModule: { findFirst: fn() },
      lesson: { findFirst: fn(), findMany: fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AcademyService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AcademyService);
  });

  describe("listPathways", () => {
    it("returns the catalogue in its intended order", async () => {
      prisma.pathway.findMany.mockResolvedValue([pathwayRow()]);

      await expect(service.listPathways()).resolves.toEqual([
        expect.objectContaining({
          slug: "agricultural-entrepreneurship-foundation",
          moduleCount: 7,
        }),
      ]);

      const [args] = prisma.pathway.findMany.mock.calls[0] as [
        { where: Record<string, unknown>; orderBy: unknown },
      ];
      expect(args.orderBy).toEqual({ sequence: "asc" });
    });

    /*
      The publication filter is this catalogue's only access control. A pathway
      being written, or one that has been retired, is not something a learner
      should be able to read by guessing a slug.
    */
    it("asks only for published, unarchived pathways", async () => {
      prisma.pathway.findMany.mockResolvedValue([]);

      await service.listPathways();

      const [args] = prisma.pathway.findMany.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(args.where).toEqual({ status: "PUBLISHED", archivedAt: null });
    });

    it("counts only the modules a learner can actually open", async () => {
      prisma.pathway.findMany.mockResolvedValue([]);

      await service.listPathways();

      const [args] = prisma.pathway.findMany.mock.calls[0] as [
        { select: { _count: { select: { modules: { where: unknown } } } } },
      ];
      // Counting every module, published or not, would promise seven and show
      // three.
      expect(args.select._count.select.modules.where).toEqual({
        status: "PUBLISHED",
        archivedAt: null,
      });
    });
  });

  describe("getPathway", () => {
    it("returns the pathway with its modules", async () => {
      prisma.pathway.findFirst.mockResolvedValue({
        ...pathwayRow(),
        modules: [moduleRow()],
      });

      await expect(service.getPathway("agricultural-entrepreneurship-foundation")).resolves.toEqual(
        expect.objectContaining({
          slug: "agricultural-entrepreneurship-foundation",
          modules: [
            expect.objectContaining({ slug: "fundamentals-of-agriculture", lessonCount: 1 }),
          ],
        }),
      );
    });

    it("is a 404 for a pathway that is not published, not 403", async () => {
      prisma.pathway.findFirst.mockResolvedValue(null);

      // 403 would confirm the slug exists. 404 says nothing either way.
      await expect(service.getPathway("being-written")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("getModule", () => {
    it("returns the module with its lessons and assessments", async () => {
      prisma.pathwayModule.findFirst.mockResolvedValue({
        ...moduleRow(),
        pathway: { slug: "agricultural-entrepreneurship-foundation", title: "Foundation" },
        lessons: [lessonRow()],
        assessments: [
          {
            id: "assessment-1",
            slug: "module-quiz",
            title: "Module quiz",
            kind: "QUIZ",
            authoringStatus: "PLACEHOLDER",
            passMarkPercent: 70,
            _count: { questions: 4 },
          },
        ],
      });

      const view = await service.getModule("foundation", "fundamentals-of-agriculture");

      expect(view.lessons[0]).toEqual(expect.objectContaining({ slug: "introduction" }));
      expect(view.assessments[0]).toEqual(
        expect.objectContaining({ questionCount: 4, passMarkPercent: 70 }),
      );
    });

    it("finds the module through its pathway, so a slug pair cannot be mixed", async () => {
      prisma.pathwayModule.findFirst.mockResolvedValue(null);

      await expect(service.getModule("greenhouse-enterprise", "entrepreneurship")).rejects.toBeInstanceOf(
        NotFoundException,
      );

      const [args] = prisma.pathwayModule.findFirst.mock.calls[0] as [
        { where: { pathway: Record<string, unknown> } },
      ];
      // A module of one pathway must not be reachable under another's slug.
      expect(args.where.pathway).toEqual(
        expect.objectContaining({ slug: "greenhouse-enterprise" }),
      );
    });

    it("never exposes whether an answer is correct", async () => {
      prisma.pathwayModule.findFirst.mockResolvedValue({
        ...moduleRow(),
        pathway: { slug: "p", title: "P" },
        lessons: [],
        assessments: [],
      });

      await service.getModule("p", "m");

      const [args] = prisma.pathwayModule.findFirst.mock.calls[0] as [
        { select: Record<string, unknown> },
      ];
      // Grading belongs in the service (api/AGENTS.md); an option reaching a
      // learner's DTO hands them the answer key.
      expect(JSON.stringify(args.select)).not.toContain("isCorrect");
      expect(JSON.stringify(args.select)).not.toContain("options");
    });
  });

  describe("getLesson", () => {
    it("returns the lesson with the module and pathway it belongs to", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        ...lessonRow(),
        module: {
          slug: "fundamentals-of-agriculture",
          title: "Fundamentals of Agriculture",
          pathway: { slug: "foundation", title: "Foundation" },
        },
      });
      prisma.lesson.findMany.mockResolvedValue([lessonRow()]);

      const view = await service.getLesson("foundation", "fundamentals-of-agriculture", "introduction");

      expect(view.pathway).toEqual({ slug: "foundation", title: "Foundation" });
      expect(view.module.slug).toBe("fundamentals-of-agriculture");
    });

    it("carries the neighbours, so a module can be worked through in order", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        ...lessonRow({ id: "lesson-1", slug: "second", sequence: 2 }),
        module: { slug: "m", title: "M", pathway: { slug: "p", title: "P" } },
      });
      prisma.lesson.findMany.mockResolvedValue([
        { id: "lesson-0", slug: "first", title: "First" },
        { id: "lesson-1", slug: "second", title: "Second" },
        { id: "lesson-2", slug: "third", title: "Third" },
      ]);

      const view = await service.getLesson("p", "m", "second");

      expect(view.previous).toEqual({ slug: "first", title: "First" });
      expect(view.next).toEqual({ slug: "third", title: "Third" });
    });

    it("has no neighbours to offer on a single-lesson module", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        ...lessonRow(),
        module: { slug: "m", title: "M", pathway: { slug: "p", title: "P" } },
      });
      prisma.lesson.findMany.mockResolvedValue([
        { id: "lesson-1", slug: "introduction", title: "Intro" },
      ]);

      const view = await service.getLesson("p", "m", "introduction");

      expect(view.previous).toBeNull();
      expect(view.next).toBeNull();
    });

    it("keeps a placeholder's null body rather than inventing content", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        ...lessonRow({ body: null, authoringStatus: "PLACEHOLDER" }),
        module: { slug: "m", title: "M", pathway: { slug: "p", title: "P" } },
      });
      prisma.lesson.findMany.mockResolvedValue([lessonRow()]);

      const view = await service.getLesson("p", "m", "introduction");

      expect(view.body).toBeNull();
      expect(view.authoringStatus).toBe("PLACEHOLDER");
    });

    it("is a 404 when the lesson, its module or its pathway is unpublished", async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.getLesson("p", "m", "missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
