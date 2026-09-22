import { jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { CohortsService } from "./cohorts.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const learner: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "ada@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "LEARNER",
};

const enrolmentRow = (overrides: Record<string, unknown> = {}) => ({
  id: "enrolment-1",
  status: "ACTIVE",
  progressPercent: 0,
  enrolledAt: new Date("2026-09-01T09:00:00Z"),
  startedAt: null,
  completedAt: null,
  cohort: {
    id: "cohort-1",
    name: "September intake",
    code: "SEP-26",
    status: "RUNNING",
    deliveryMode: "BLENDED",
    startsOn: new Date("2026-09-01T00:00:00Z"),
    endsOn: null,
    pathway: {
      id: "pathway-1",
      slug: "agricultural-entrepreneurship-foundation",
      title: "Agricultural Entrepreneurship Foundation",
      summary: "Where every learner starts.",
      level: "FOUNDATION",
    },
  },
  ...overrides,
});

describe("CohortsService", () => {
  let service: CohortsService;
  let prisma: {
    enrolment: { findMany: AsyncMock; findFirst: AsyncMock; upsert: AsyncMock };
    pathway: { findFirst: AsyncMock };
    cohort: { findFirst: AsyncMock; create: AsyncMock };
    membership: { findFirst: AsyncMock };
  };

  beforeEach(async () => {
    prisma = {
      enrolment: { findMany: fn(), findFirst: fn(), upsert: fn() },
      pathway: { findFirst: fn() },
      cohort: { findFirst: fn(), create: fn() },
      membership: { findFirst: fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [CohortsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CohortsService);
  });

  describe("listMine", () => {
    it("returns the caller's enrolments with their cohort and pathway", async () => {
      prisma.enrolment.findMany.mockResolvedValue([enrolmentRow()]);

      const [view] = await service.listMine(learner);

      expect(view).toEqual(
        expect.objectContaining({
          id: "enrolment-1",
          progressPercent: 0,
          cohort: expect.objectContaining({ name: "September intake" }),
        }),
      );
    });

    /*
      The two filters that matter. Without the institution, a learner who
      belongs to two would see both at once; without the user, they would see
      their whole cohort's enrolments.
    */
    it("filters on both the caller and the institution in the token", async () => {
      prisma.enrolment.findMany.mockResolvedValue([]);

      await service.listMine(learner);

      const [args] = prisma.enrolment.findMany.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(args.where).toEqual(
        expect.objectContaining({ userId: "user-1", institutionId: "institution-1" }),
      );
    });

    it("returns nothing for someone with no active institution, without querying", async () => {
      await expect(
        service.listMine({ ...learner, institutionId: null, institutionRole: null }),
      ).resolves.toEqual([]);
      expect(prisma.enrolment.findMany).not.toHaveBeenCalled();
    });

    it("formats a cohort's dates as plain days, not instants", async () => {
      prisma.enrolment.findMany.mockResolvedValue([enrolmentRow()]);

      const [view] = await service.listMine(learner);

      // The column is a DATE; sending an instant invites a timezone to move it.
      expect(view.cohort.startsOn).toBe("2026-09-01");
      expect(view.cohort.endsOn).toBeNull();
    });

    it("leaves out an enrolment the learner withdrew from", async () => {
      prisma.enrolment.findMany.mockResolvedValue([]);

      await service.listMine(learner);

      const [args] = prisma.enrolment.findMany.mock.calls[0] as [
        { where: { status: { in: string[] } } },
      ];
      expect(args.where.status.in).not.toContain("WITHDRAWN");
    });
  });

  describe("getMine", () => {
    it("returns one enrolment the caller owns", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(enrolmentRow());

      await expect(service.getMine(learner, "enrolment-1")).resolves.toEqual(
        expect.objectContaining({ id: "enrolment-1" }),
      );
    });

    it("is a 404 for someone else's enrolment, not a 403", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      // 403 would confirm the id is real (api/AGENTS.md).
      await expect(service.getMine(learner, "enrolment-9")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("never looks an enrolment up by id alone", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      await service.getMine(learner, "enrolment-9").catch(() => undefined);

      const [args] = prisma.enrolment.findFirst.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(args.where).toEqual(
        expect.objectContaining({
          id: "enrolment-9",
          userId: "user-1",
          institutionId: "institution-1",
        }),
      );
    });

    it("is a 404 rather than a query when there is no active institution", async () => {
      await expect(
        service.getMine({ ...learner, institutionId: null }, "enrolment-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.enrolment.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("createCohort", () => {
    const cohortRow = {
      id: "cohort-1",
      name: "September intake",
      code: null,
      status: "OPEN",
      deliveryMode: "BLENDED",
      startsOn: new Date("2026-09-01T00:00:00Z"),
      endsOn: null,
      pathway: {
        id: "pathway-1",
        slug: "foundation",
        title: "Foundation",
        summary: "s",
        level: "FOUNDATION",
      },
    };

    it("opens an intake against a published pathway", async () => {
      prisma.pathway.findFirst.mockResolvedValue({ id: "pathway-1" });
      prisma.cohort.create.mockResolvedValue(cohortRow);

      await expect(
        service.createCohort("institution-1", {
          pathwaySlug: "foundation",
          name: "September intake",
          startsOn: "2026-09-01",
        }),
      ).resolves.toMatchObject({ id: "cohort-1", startsOn: "2026-09-01" });
    });

    it("never sets a capacity, which would read as a real figure", async () => {
      prisma.pathway.findFirst.mockResolvedValue({ id: "pathway-1" });
      prisma.cohort.create.mockResolvedValue(cohortRow);

      await service.createCohort("institution-1", { pathwaySlug: "foundation", name: "x" });

      const [args] = prisma.cohort.create.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).not.toHaveProperty("capacity");
    });

    it("refuses a pathway that is not published", async () => {
      prisma.pathway.findFirst.mockResolvedValue(null);

      await expect(
        service.createCohort("institution-1", { pathwaySlug: "being-written", name: "x" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("enrol", () => {
    beforeEach(() => {
      prisma.cohort.findFirst.mockResolvedValue({ id: "cohort-1" });
      prisma.membership.findFirst.mockResolvedValue({ userId: "user-1" });
      prisma.enrolment.upsert.mockResolvedValue(enrolmentRow());
    });

    it("stamps the institution from the cohort, not from the request", async () => {
      await service.enrol("institution-1", "cohort-1", { email: "Ada@Example.com " });

      const [args] = prisma.enrolment.upsert.mock.calls[0] as [
        { create: { institutionId: string } },
      ];
      // The two could otherwise disagree, and every tenant query reads this.
      expect(args.create.institutionId).toBe("institution-1");
    });

    it("matches the member on a normalised email", async () => {
      await service.enrol("institution-1", "cohort-1", { email: "  Ada@Example.com " });

      const [args] = prisma.membership.findFirst.mock.calls[0] as [
        { where: { user: { email: string } } },
      ];
      expect(args.where.user.email).toBe("ada@example.com");
    });

    it("does not reset progress when someone is enrolled twice", async () => {
      await service.enrol("institution-1", "cohort-1", { email: "ada@example.com" });

      const [args] = prisma.enrolment.upsert.mock.calls[0] as [{ update: object }];
      expect(args.update).toEqual({});
    });

    it("refuses someone who is not an active member of the institution", async () => {
      prisma.membership.findFirst.mockResolvedValue(null);

      await expect(
        service.enrol("institution-1", "cohort-1", { email: "stranger@example.com" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("is a 404 for a cohort belonging to another institution", async () => {
      prisma.cohort.findFirst.mockResolvedValue(null);

      await expect(
        service.enrol("institution-1", "cohort-9", { email: "ada@example.com" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
