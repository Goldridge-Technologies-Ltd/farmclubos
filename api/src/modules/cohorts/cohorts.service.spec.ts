import { jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
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
  let prisma: { enrolment: { findMany: AsyncMock; findFirst: AsyncMock } };

  beforeEach(async () => {
    prisma = { enrolment: { findMany: fn(), findFirst: fn() } };

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
});
