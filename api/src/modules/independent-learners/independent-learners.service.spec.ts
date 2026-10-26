import { jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { Prisma } from "../../generated/prisma/client.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { IndependentLearnersService } from "./independent-learners.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const home = (overrides: Record<string, unknown> = {}) => ({
  id: "home-1",
  slug: "farmclub-independent-learners",
  name: "FARMCLUB Independent Learners",
  type: "OTHER",
  kind: "INDEPENDENT_LEARNERS",
  status: "ACTIVE",
  ...overrides,
});

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "7.10.0",
  });

describe("IndependentLearnersService", () => {
  let service: IndependentLearnersService;
  let prisma: {
    institution: { findFirst: AsyncMock; create: AsyncMock };
    membership: { findUnique: AsyncMock; create: AsyncMock; update: AsyncMock };
    learnerProfile: { findUnique: AsyncMock; create: AsyncMock };
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    prisma = {
      institution: { findFirst: fn(), create: fn() },
      membership: { findUnique: fn(), create: fn(), update: fn() },
      learnerProfile: { findUnique: fn(), create: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn((work: unknown) => (work as (tx: unknown) => Promise<unknown>)(prisma)),
    };
    prisma.institution.findFirst.mockResolvedValue(null);
    prisma.institution.create.mockImplementation((args) =>
      Promise.resolve(home((args as { data: Record<string, unknown> }).data)),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        IndependentLearnersService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => "FARMCLUB OS <no-reply@farmclubos.com>" },
        },
      ],
    }).compile();

    service = moduleRef.get(IndependentLearnersService);
  });

  describe("home", () => {
    it("finds the home by its kind, never by its name", async () => {
      prisma.institution.findFirst.mockResolvedValue(home());

      await expect(service.home()).resolves.toMatchObject({ id: "home-1" });
      expect(prisma.institution.findFirst).toHaveBeenCalledWith({
        where: { kind: "INDEPENDENT_LEARNERS" },
      });
      expect(prisma.institution.create).not.toHaveBeenCalled();
    });

    it("makes it the first time it is needed: active, and FARMCLUB's own", async () => {
      await service.home();

      expect(prisma.institution.create).toHaveBeenCalledWith({
        data: {
          slug: "farmclub-independent-learners",
          name: "FARMCLUB Independent Learners",
          type: "OTHER",
          kind: "INDEPENDENT_LEARNERS",
          status: "ACTIVE",
          contactEmail: "no-reply@farmclubos.com",
        },
      });
      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: "institution.created", entityType: "Institution" }),
      });
    });

    it("hands back the one another request made first", async () => {
      prisma.institution.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(home());
      prisma.institution.create.mockRejectedValueOnce(uniqueViolation());

      await expect(service.home()).resolves.toMatchObject({ id: "home-1" });
      expect(prisma.institution.create).toHaveBeenCalledTimes(1);
    });

    it("takes another slug when a partner institution already has its own", async () => {
      prisma.institution.create.mockRejectedValueOnce(uniqueViolation());

      await service.home();

      const second = prisma.institution.create.mock.calls[1]?.[0] as { data: { slug: string } };
      expect(second.data.slug).toMatch(/^farmclub-independent-learners-[0-9a-f]{6}$/);
    });
  });

  describe("joinAsLearner", () => {
    const now = new Date("2026-10-26T09:00:00Z");
    const join = () => service.joinAsLearner(prisma as never, "user-1", "home-1", now, "Signed up");

    it("makes a newcomer an active learner with a learner profile", async () => {
      prisma.membership.findUnique.mockResolvedValue(null);
      prisma.learnerProfile.findUnique.mockResolvedValue(null);

      await join();

      expect(prisma.membership.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          institutionId: "home-1",
          role: "LEARNER",
          status: "ACTIVE",
          joinedAt: now,
        },
      });
      expect(prisma.learnerProfile.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          state: "EXPLORER",
          stateChanges: { create: { toState: "EXPLORER", reason: "Signed up" } },
        },
      });
    });

    it.each(["INVITED", "LEFT"])("brings back a membership that is %s", async (status) => {
      prisma.membership.findUnique.mockResolvedValue({ status });
      prisma.learnerProfile.findUnique.mockResolvedValue({ id: "profile-1" });

      await join();

      expect(prisma.membership.update).toHaveBeenCalledWith({
        where: { userId_institutionId: { userId: "user-1", institutionId: "home-1" } },
        data: { status: "ACTIVE", joinedAt: now },
      });
      expect(prisma.learnerProfile.create).not.toHaveBeenCalled();
    });

    it("leaves an active member as they are, whatever their role", async () => {
      prisma.membership.findUnique.mockResolvedValue({ status: "ACTIVE" });
      prisma.learnerProfile.findUnique.mockResolvedValue({ id: "profile-1" });

      await join();

      expect(prisma.membership.create).not.toHaveBeenCalled();
      expect(prisma.membership.update).not.toHaveBeenCalled();
    });

    it("refuses someone the platform team suspended, rather than reinstating them", async () => {
      prisma.membership.findUnique.mockResolvedValue({ status: "SUSPENDED" });

      await expect(join()).rejects.toMatchObject({
        response: { code: "MEMBERSHIP_SUSPENDED" },
      });
      await expect(join()).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.membership.update).not.toHaveBeenCalled();
    });
  });
});
