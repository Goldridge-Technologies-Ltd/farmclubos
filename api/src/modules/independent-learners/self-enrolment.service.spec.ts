import { jest } from "@jest/globals";
import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { Prisma } from "../../generated/prisma/client.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { AuthService } from "../auth/auth.service.js";
import { IndependentLearnersService } from "./independent-learners.service.js";
import { SelfEnrolmentService } from "./self-enrolment.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const learner: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "ada@example.com",
  platformRole: "NONE",
  institutionId: "home-1",
  institutionRole: "LEARNER",
};

const pathway = { id: "pathway-1", slug: "foundation", title: "Foundation" };
const cohort = (overrides: Record<string, unknown> = {}) => ({
  id: "cohort-1",
  status: "OPEN",
  archivedAt: null,
  ...overrides,
});

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "7.10.0",
  });

describe("SelfEnrolmentService", () => {
  let service: SelfEnrolmentService;
  let independent: { home: AsyncMock; joinAsLearner: AsyncMock };
  let auth: { switchInstitution: AsyncMock };
  let prisma: {
    pathway: { findFirst: AsyncMock };
    cohort: { findFirst: AsyncMock; create: AsyncMock };
    enrolment: { findFirst: AsyncMock; findUnique: AsyncMock; create: AsyncMock; update: AsyncMock };
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    independent = { home: fn(), joinAsLearner: fn() };
    auth = { switchInstitution: fn() };
    prisma = {
      pathway: { findFirst: fn() },
      cohort: { findFirst: fn(), create: fn() },
      enrolment: { findFirst: fn(), findUnique: fn(), create: fn(), update: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn((work: unknown) => (work as (tx: unknown) => Promise<unknown>)(prisma)),
    };
    independent.home.mockResolvedValue({ id: "home-1" });
    prisma.pathway.findFirst.mockResolvedValue(pathway);
    prisma.enrolment.findFirst.mockResolvedValue(null);
    prisma.cohort.findFirst.mockResolvedValue(cohort());
    prisma.enrolment.findUnique.mockResolvedValue(null);
    prisma.enrolment.create.mockResolvedValue({ id: "enrolment-1", status: "ACTIVE" });
    prisma.enrolment.update.mockResolvedValue({ id: "enrolment-1", status: "ACTIVE" });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SelfEnrolmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: IndependentLearnersService, useValue: independent },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();

    service = moduleRef.get(SelfEnrolmentService);
  });

  it("starts only a published pathway, found by its slug", async () => {
    prisma.pathway.findFirst.mockResolvedValue(null);

    await expect(service.start(learner, "drafted")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.pathway.findFirst).toHaveBeenCalledWith({
      where: { slug: "drafted", status: "PUBLISHED", archivedAt: null },
      select: { id: true, slug: true, title: true },
    });
    expect(prisma.enrolment.create).not.toHaveBeenCalled();
  });

  /*
    Progress belongs to an enrolment, so a second one on the same pathway
    would be a second, empty record of work already under way.
  */
  it("will not start a pathway the person is taking with an institution", async () => {
    prisma.enrolment.findFirst.mockResolvedValue({
      institution: { name: "Greenfield Technical College" },
    });

    const attempt = service.start(learner, "foundation");

    await expect(attempt).rejects.toBeInstanceOf(ConflictException);
    await expect(attempt).rejects.toMatchObject({
      response: {
        code: "ENROLLED_WITH_INSTITUTION",
        message: expect.stringContaining("Greenfield Technical College"),
      },
    });
    expect(prisma.enrolment.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        status: { in: ["INVITED", "ACTIVE", "COMPLETED"] },
        cohort: { pathwayId: "pathway-1", archivedAt: null },
        institution: { kind: "STANDARD", status: "ACTIVE", archivedAt: null },
      },
      select: { institution: { select: { name: true } } },
    });
    expect(prisma.enrolment.create).not.toHaveBeenCalled();
  });

  it("makes the pathway's self-paced cohort the first time anyone starts it", async () => {
    prisma.cohort.findFirst.mockResolvedValue(null);
    prisma.cohort.create.mockResolvedValue(cohort());

    await service.start(learner, "foundation");

    expect(prisma.cohort.findFirst).toHaveBeenCalledWith({
      where: { pathwayId: "pathway-1", selfPaced: true },
      select: { id: true, status: true, archivedAt: true },
    });
    expect(prisma.cohort.create).toHaveBeenCalledWith({
      data: {
        institutionId: "home-1",
        pathwayId: "pathway-1",
        name: "Self-paced",
        status: "OPEN",
        deliveryMode: "ONLINE",
        selfPaced: true,
      },
      select: { id: true, status: true, archivedAt: true },
    });
  });

  it("uses the cohort another request made first", async () => {
    prisma.cohort.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(cohort());
    prisma.cohort.create.mockRejectedValue(uniqueViolation());

    await service.start(learner, "foundation");

    expect(prisma.enrolment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ cohortId: "cohort-1" }),
      select: { id: true, status: true },
    });
  });

  it("makes the person a learner in the home, then enrols them, active from now", async () => {
    await expect(service.start(learner, "foundation")).resolves.toMatchObject({
      enrolmentId: "enrolment-1",
      status: "ACTIVE",
    });

    expect(independent.joinAsLearner).toHaveBeenCalledWith(
      prisma,
      "user-1",
      "home-1",
      expect.any(Date),
      "Started a pathway on their own",
    );
    expect(prisma.enrolment.create).toHaveBeenCalledWith({
      data: {
        cohortId: "cohort-1",
        userId: "user-1",
        institutionId: "home-1",
        status: "ACTIVE",
        startedAt: expect.any(Date),
      },
      select: { id: true, status: true },
    });
    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        institutionId: "home-1",
        actorUserId: "user-1",
        action: "enrolment.started",
        entityType: "Enrolment",
        entityId: "enrolment-1",
        metadata: { pathwayId: "pathway-1" },
      },
    });
  });

  it("stops someone the platform team suspended before anything is written", async () => {
    independent.joinAsLearner.mockRejectedValue(new ForbiddenException({ code: "MEMBERSHIP_SUSPENDED" }));

    await expect(service.start(learner, "foundation")).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.enrolment.create).not.toHaveBeenCalled();
  });

  it.each(["ACTIVE", "COMPLETED"])("changes nothing for someone already %s", async (status) => {
    prisma.enrolment.findUnique.mockResolvedValue({ id: "enrolment-1", status });

    await expect(service.start(learner, "foundation")).resolves.toMatchObject({ status });
    expect(prisma.enrolment.create).not.toHaveBeenCalled();
    expect(prisma.enrolment.update).not.toHaveBeenCalled();
    expect(prisma.auditEvent.create).not.toHaveBeenCalled();
  });

  it("brings back someone withdrawn, where their progress is waiting", async () => {
    prisma.enrolment.findUnique.mockResolvedValue({ id: "enrolment-1", status: "WITHDRAWN" });

    await service.start(learner, "foundation");

    expect(prisma.enrolment.update).toHaveBeenCalledWith({
      where: { id: "enrolment-1" },
      data: { status: "ACTIVE", withdrawnAt: null },
      select: { id: true, status: true },
    });
    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "enrolment.resumed" }),
    });
  });

  /*
    Closing a pathway's self-paced cohort is how the platform team stops new
    independent learners starting it. Those already on it carry on.
  */
  it.each([
    ["closed", { status: "COMPLETED" }],
    ["cancelled", { status: "CANCELLED" }],
    ["archived", { archivedAt: new Date() }],
  ])("takes nobody new once the cohort is %s", async (_, overrides) => {
    prisma.cohort.findFirst.mockResolvedValue(cohort(overrides));

    await expect(service.start(learner, "foundation")).rejects.toMatchObject({
      response: { code: "PATHWAY_NOT_TAKING_LEARNERS" },
    });
    expect(prisma.enrolment.create).not.toHaveBeenCalled();
  });

  it("lets someone already on a closed cohort carry on", async () => {
    prisma.cohort.findFirst.mockResolvedValue(cohort({ status: "COMPLETED" }));
    prisma.enrolment.findUnique.mockResolvedValue({ id: "enrolment-1", status: "ACTIVE" });

    await expect(service.start(learner, "foundation")).resolves.toMatchObject({ status: "ACTIVE" });
  });

  it("moves the session to independent learning, where the progress is recorded", async () => {
    const switched = { accessToken: "access", activeInstitutionId: "home-1" };
    auth.switchInstitution.mockResolvedValue(switched);
    const fromCollege = { ...learner, institutionId: "institution-1" };

    await expect(service.start(fromCollege, "foundation")).resolves.toMatchObject({
      session: switched,
    });
    expect(auth.switchInstitution).toHaveBeenCalledWith(fromCollege, "home-1");
  });

  it("leaves a session that is already there alone", async () => {
    await expect(service.start(learner, "foundation")).resolves.toMatchObject({ session: null });
    expect(auth.switchInstitution).not.toHaveBeenCalled();
  });
});
