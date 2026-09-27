import { jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { Prisma } from "../../generated/prisma/client.js";
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

const cohortRow = (overrides: Record<string, unknown> = {}) => ({
  id: "cohort-1",
  name: "September intake",
  code: null,
  status: "OPEN",
  deliveryMode: "BLENDED",
  startsOn: new Date("2026-09-01T00:00:00Z"),
  endsOn: null,
  pathway: { id: "p", slug: "foundation", title: "Foundation", summary: "s", level: "FOUNDATION" },
  ...overrides,
});

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "7.10.0",
  });

describe("CohortsService", () => {
  let service: CohortsService;
  let prisma: {
    enrolment: {
      findMany: AsyncMock;
      findFirst: AsyncMock;
      findUnique: AsyncMock;
      create: AsyncMock;
      update: AsyncMock;
    };
    pathway: { findFirst: AsyncMock };
    cohort: { findFirst: AsyncMock; findMany: AsyncMock; create: AsyncMock; update: AsyncMock };
    membership: { findFirst: AsyncMock };
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    prisma = {
      enrolment: {
        findMany: fn(),
        findFirst: fn(),
        findUnique: fn(),
        create: fn(),
        update: fn(),
      },
      pathway: { findFirst: fn() },
      cohort: { findFirst: fn(), findMany: fn(), create: fn(), update: fn() },
      membership: { findFirst: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn(async (work: unknown) =>
        (work as (client: typeof prisma) => Promise<unknown>)(prisma),
      ),
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
        service.createCohort("admin-1", "institution-1", {
          pathwaySlug: "foundation",
          name: "September intake",
          startsOn: "2026-09-01",
        }),
      ).resolves.toMatchObject({ id: "cohort-1", startsOn: "2026-09-01" });
    });

    it("never sets a capacity, which would read as a real figure", async () => {
      prisma.pathway.findFirst.mockResolvedValue({ id: "pathway-1" });
      prisma.cohort.create.mockResolvedValue(cohortRow);

      await service.createCohort("admin-1", "institution-1", { pathwaySlug: "foundation", name: "x" });

      const [args] = prisma.cohort.create.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).not.toHaveProperty("capacity");
    });

    it("refuses a code the institution already uses, rather than failing with a 500", async () => {
      prisma.pathway.findFirst.mockResolvedValue({ id: "pathway-1" });
      prisma.cohort.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createCohort("admin-1", "institution-1", {
          pathwaySlug: "foundation",
          name: "x",
          code: "SEP-26",
        }),
      ).rejects.toMatchObject({ response: { code: "CODE_TAKEN" } });
    });

    it("refuses a pathway that is not published", async () => {
      prisma.pathway.findFirst.mockResolvedValue(null);

      await expect(
        service.createCohort("admin-1", "institution-1", { pathwaySlug: "being-written", name: "x" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("enrol", () => {
    beforeEach(() => {
      prisma.cohort.findFirst.mockResolvedValue({ id: "cohort-1", status: "OPEN" });
      prisma.membership.findFirst.mockResolvedValue({ userId: "user-1" });
      prisma.enrolment.findUnique.mockResolvedValue(null);
      prisma.enrolment.create.mockResolvedValue(enrolmentRow());
      prisma.enrolment.update.mockResolvedValue(enrolmentRow());
    });

    it("stamps the institution from the cohort, not from the request", async () => {
      await service.enrol("admin-1", "institution-1", "cohort-1", { email: "Ada@Example.com " });

      const [args] = prisma.enrolment.create.mock.calls[0] as [
        { data: { institutionId: string; status: string } },
      ];
      // The two could otherwise disagree, and every tenant query reads this.
      expect(args.data.institutionId).toBe("institution-1");
      expect(args.data.status).toBe("ACTIVE");
    });

    it("matches the member on a normalised email", async () => {
      await service.enrol("admin-1", "institution-1", "cohort-1", { email: "  Ada@Example.com " });

      const [args] = prisma.membership.findFirst.mock.calls[0] as [
        { where: { user: { email: string } } },
      ];
      expect(args.where.user.email).toBe("ada@example.com");
    });

    it("leaves an active or finished enrolment exactly as it is", async () => {
      prisma.enrolment.findUnique.mockResolvedValue(enrolmentRow({ status: "ACTIVE" }));

      await service.enrol("admin-1", "institution-1", "cohort-1", { email: "ada@example.com" });

      // Enrolling twice is not an error, and must not reset their progress.
      expect(prisma.enrolment.create).not.toHaveBeenCalled();
      expect(prisma.enrolment.update).not.toHaveBeenCalled();
    });

    it("reactivates a withdrawn enrolment, keeping its progress", async () => {
      prisma.enrolment.findUnique.mockResolvedValue(
        enrolmentRow({ id: "enrolment-1", status: "WITHDRAWN", progressPercent: 43 }),
      );

      await service.enrol("admin-1", "institution-1", "cohort-1", { email: "ada@example.com" });

      const [args] = prisma.enrolment.update.mock.calls[0] as [
        { where: { id: string }; data: Record<string, unknown> },
      ];
      expect(args.where.id).toBe("enrolment-1");
      // Status and withdrawal only: progress is untouched, so it resumes.
      expect(args.data).toEqual({ status: "ACTIVE", withdrawnAt: null });
      expect(prisma.enrolment.create).not.toHaveBeenCalled();
    });

    it("records who enrolled whom", async () => {
      await service.enrol("admin-1", "institution-1", "cohort-1", { email: "ada@example.com" });

      const [args] = prisma.auditEvent.create.mock.calls[0] as [
        { data: { actorUserId: string; action: string; institutionId: string } },
      ];
      expect(args.data).toMatchObject({
        actorUserId: "admin-1",
        institutionId: "institution-1",
        action: "enrolment.created",
      });
    });

    it("refuses a closed cohort", async () => {
      prisma.cohort.findFirst.mockResolvedValue({ id: "cohort-1", status: "COMPLETED" });

      await expect(
        service.enrol("admin-1", "institution-1", "cohort-1", { email: "ada@example.com" }),
      ).rejects.toMatchObject({ response: { code: "COHORT_CLOSED" } });
    });

    it("refuses someone who is not an active member of the institution", async () => {
      prisma.membership.findFirst.mockResolvedValue(null);

      await expect(
        service.enrol("admin-1", "institution-1", "cohort-1", { email: "stranger@example.com" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("is a 404 for a cohort belonging to another institution", async () => {
      prisma.cohort.findFirst.mockResolvedValue(null);

      await expect(
        service.enrol("admin-1", "institution-1", "cohort-9", { email: "ada@example.com" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("listForInstitution", () => {
    it("lists that institution's cohorts with a real enrolment count", async () => {
      prisma.cohort.findMany.mockResolvedValue([
        {
          id: "cohort-1",
          name: "September intake",
          code: null,
          status: "OPEN",
          deliveryMode: "BLENDED",
          startsOn: new Date("2026-09-01T00:00:00Z"),
          endsOn: null,
          pathway: { id: "p", slug: "foundation", title: "Foundation", summary: "s", level: "FOUNDATION" },
          _count: { enrolments: 3 },
        },
      ]);

      const [cohort] = await service.listForInstitution("institution-1");

      expect(cohort).toMatchObject({ id: "cohort-1", startsOn: "2026-09-01", enrolmentCount: 3 });
      const [args] = prisma.cohort.findMany.mock.calls[0] as [{ where: Record<string, unknown> }];
      expect(args.where).toEqual({ institutionId: "institution-1", archivedAt: null });
    });
  });

  describe("getForInstitution", () => {
    it("returns the cohort with its learners and their real progress", async () => {
      prisma.cohort.findFirst.mockResolvedValue({
        id: "cohort-1",
        name: "September intake",
        code: null,
        status: "OPEN",
        deliveryMode: "BLENDED",
        startsOn: null,
        endsOn: null,
        pathway: { id: "p", slug: "foundation", title: "Foundation", summary: "s", level: "FOUNDATION" },
        enrolments: [
          {
            id: "enrolment-1",
            status: "ACTIVE",
            progressPercent: 14,
            enrolledAt: new Date("2026-09-20T10:00:00Z"),
            user: { id: "user-2", firstName: "Ada", lastName: "Obi", email: "ada@example.com" },
          },
        ],
      });

      const view = await service.getForInstitution("institution-1", "cohort-1");

      expect(view.enrolments[0]).toEqual({
        id: "enrolment-1",
        status: "ACTIVE",
        progressPercent: 14,
        enrolledAt: new Date("2026-09-20T10:00:00Z"),
        learner: { userId: "user-2", firstName: "Ada", lastName: "Obi", email: "ada@example.com" },
      });
    });

    it("is a 404 for a cohort of another institution", async () => {
      prisma.cohort.findFirst.mockResolvedValue(null);

      await expect(service.getForInstitution("institution-1", "cohort-9")).rejects.toBeInstanceOf(
        NotFoundException,
      );

      const [args] = prisma.cohort.findFirst.mock.calls[0] as [{ where: Record<string, unknown> }];
      // Found through the institution, never by id alone.
      expect(args.where).toEqual(
        expect.objectContaining({ id: "cohort-9", institutionId: "institution-1" }),
      );
    });
  });

  /*
    A removed member's token still names the institution for up to fifteen
    minutes. Both reads must ask the database whether they still belong.
  */
  describe("a member who has been removed", () => {
    it("is not shown their enrolments", async () => {
      prisma.enrolment.findMany.mockResolvedValue([]);

      await service.listMine(learner);

      const [args] = prisma.enrolment.findMany.mock.calls[0] as [
        { where: { user: unknown; institution: unknown } },
      ];
      expect(args.where.user).toEqual({ memberships: { some: { institutionId: "institution-1", status: "ACTIVE" } } });
      expect(args.where.institution).toEqual({ status: "ACTIVE", archivedAt: null });
    });

    it("cannot open one by id either", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      await service.getMine(learner, "enrolment-1").catch(() => undefined);

      const [args] = prisma.enrolment.findFirst.mock.calls[0] as [{ where: { user: unknown } }];
      expect(args.where.user).toEqual({ memberships: { some: { institutionId: "institution-1", status: "ACTIVE" } } });
    });
  });

  describe("updateCohort", () => {
    const current = { id: "cohort-1", startsOn: new Date("2026-09-01T00:00:00Z"), endsOn: null };

    beforeEach(() => {
      prisma.cohort.findFirst.mockResolvedValue(current);
      prisma.cohort.update.mockResolvedValue({ ...cohortRow(), name: "Renamed" });
    });

    it("changes only what was sent", async () => {
      await service.updateCohort("admin-1", "institution-1", "cohort-1", { name: "Renamed" });

      const [args] = prisma.cohort.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ name: "Renamed" });
    });

    it("clears a code or a date when sent null", async () => {
      await service.updateCohort("admin-1", "institution-1", "cohort-1", {
        code: null,
        startsOn: null,
      });

      const [args] = prisma.cohort.update.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args.data).toEqual({ code: null, startsOn: null });
    });

    it("refuses an end before the start, judged against the dates it would end up with", async () => {
      // Only the end is sent; the start already on the cohort is what it is judged against.
      await expect(
        service.updateCohort("admin-1", "institution-1", "cohort-1", { endsOn: "2026-08-01" }),
      ).rejects.toMatchObject({ response: { code: "DATES_OUT_OF_ORDER" } });
      expect(prisma.cohort.update).not.toHaveBeenCalled();
    });

    it("refuses a code the institution already uses", async () => {
      prisma.cohort.update.mockRejectedValue(uniqueViolation());

      await expect(
        service.updateCohort("admin-1", "institution-1", "cohort-1", { code: "SEP-26" }),
      ).rejects.toMatchObject({ response: { code: "CODE_TAKEN" } });
    });

    it("records what changed", async () => {
      await service.updateCohort("admin-1", "institution-1", "cohort-1", { name: "Renamed" });

      const [args] = prisma.auditEvent.create.mock.calls[0] as [
        { data: { action: string; metadata: { fields: string[] } } },
      ];
      expect(args.data.action).toBe("cohort.updated");
      expect(args.data.metadata.fields).toEqual(["name"]);
    });

    it("is a 404 for a cohort of another institution", async () => {
      prisma.cohort.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCohort("admin-1", "institution-1", "cohort-9", { name: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("closeCohort and reopenCohort", () => {
    it("closes an open intake", async () => {
      prisma.cohort.findFirst.mockResolvedValue({ id: "cohort-1", status: "OPEN" });
      prisma.cohort.update.mockResolvedValue(cohortRow({ status: "COMPLETED" }));

      await expect(
        service.closeCohort("admin-1", "institution-1", "cohort-1"),
      ).resolves.toMatchObject({ status: "COMPLETED" });

      const [args] = prisma.cohort.update.mock.calls[0] as [{ data: { status: string } }];
      expect(args.data).toEqual({ status: "COMPLETED" });
      const [audit] = prisma.auditEvent.create.mock.calls[0] as [{ data: { action: string } }];
      expect(audit.data.action).toBe("cohort.closed");
    });

    it("leaves every enrolment alone, so learners can still finish", async () => {
      prisma.cohort.findFirst.mockResolvedValue({ id: "cohort-1", status: "OPEN" });
      prisma.cohort.update.mockResolvedValue(cohortRow({ status: "COMPLETED" }));

      await service.closeCohort("admin-1", "institution-1", "cohort-1");

      expect(prisma.enrolment.update).not.toHaveBeenCalled();
    });

    it("treats closing a closed cohort as done, not an error", async () => {
      prisma.cohort.findFirst.mockResolvedValue({ id: "cohort-1", status: "COMPLETED" });
      prisma.cohort.update.mockResolvedValue(cohortRow({ status: "COMPLETED" }));

      await service.closeCohort("admin-1", "institution-1", "cohort-1");

      expect(prisma.auditEvent.create).not.toHaveBeenCalled();
    });

    it("reopens a closed intake", async () => {
      prisma.cohort.findFirst.mockResolvedValue({ id: "cohort-1", status: "COMPLETED" });
      prisma.cohort.update.mockResolvedValue(cohortRow({ status: "OPEN" }));

      await expect(
        service.reopenCohort("admin-1", "institution-1", "cohort-1"),
      ).resolves.toMatchObject({ status: "OPEN" });

      const [audit] = prisma.auditEvent.create.mock.calls[0] as [{ data: { action: string } }];
      expect(audit.data.action).toBe("cohort.reopened");
    });

    it("is a 404 for a cohort of another institution", async () => {
      prisma.cohort.findFirst.mockResolvedValue(null);

      await expect(service.closeCohort("admin-1", "institution-1", "cohort-9")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("withdraw", () => {
    const withdrawnRow = {
      id: "enrolment-1",
      status: "WITHDRAWN",
      progressPercent: 43,
      enrolledAt: new Date("2026-09-20T10:00:00Z"),
      withdrawnAt: new Date("2026-09-27T10:00:00Z"),
      user: { id: "user-1", firstName: "Ada", lastName: "Obi", email: "ada@example.com" },
    };

    it("withdraws an open enrolment and keeps its progress", async () => {
      prisma.enrolment.findFirst.mockResolvedValue({ id: "enrolment-1", status: "ACTIVE" });
      prisma.enrolment.update.mockResolvedValue(withdrawnRow);

      const view = await service.withdraw("admin-1", "institution-1", "cohort-1", "enrolment-1");

      const [args] = prisma.enrolment.update.mock.calls[0] as [
        { data: { status: string; withdrawnAt: Date } },
      ];
      expect(args.data.status).toBe("WITHDRAWN");
      expect(args.data.withdrawnAt).toBeInstanceOf(Date);
      expect(Object.keys(args.data)).toEqual(["status", "withdrawnAt"]);
      expect(view).toMatchObject({ status: "WITHDRAWN", progressPercent: 43 });
    });

    it("finds the enrolment through the cohort and the institution, never by id alone", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      await service.withdraw("admin-1", "institution-1", "cohort-1", "enrolment-9").catch(() => undefined);

      const [args] = prisma.enrolment.findFirst.mock.calls[0] as [{ where: Record<string, unknown> }];
      expect(args.where).toMatchObject({
        id: "enrolment-9",
        cohortId: "cohort-1",
        institutionId: "institution-1",
      });
    });

    it("refuses to withdraw someone who has finished — there is nothing left to withdraw", async () => {
      prisma.enrolment.findFirst.mockResolvedValue({ id: "enrolment-1", status: "COMPLETED" });

      await expect(
        service.withdraw("admin-1", "institution-1", "cohort-1", "enrolment-1"),
      ).rejects.toMatchObject({ response: { code: "ENROLMENT_COMPLETED" } });
    });

    it("records who withdrew whom", async () => {
      prisma.enrolment.findFirst.mockResolvedValue({ id: "enrolment-1", status: "ACTIVE" });
      prisma.enrolment.update.mockResolvedValue(withdrawnRow);

      await service.withdraw("admin-1", "institution-1", "cohort-1", "enrolment-1");

      const [audit] = prisma.auditEvent.create.mock.calls[0] as [
        { data: { action: string; actorUserId: string; entityId: string } },
      ];
      expect(audit.data).toMatchObject({
        action: "enrolment.withdrawn",
        actorUserId: "admin-1",
        entityId: "enrolment-1",
      });
    });

    it("is a 404 for an enrolment not on that cohort", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      await expect(
        service.withdraw("admin-1", "institution-1", "cohort-1", "enrolment-9"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
