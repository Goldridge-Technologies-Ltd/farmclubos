import { jest } from "@jest/globals";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PaginatedResult } from "../../common/http/api-response.js";
import { Prisma } from "../../generated/prisma/client.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { InstitutionAccessService } from "./institution-access.service.js";
import { InstitutionsService } from "./institutions.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const admin: AuthenticatedUser = {
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.com",
  platformRole: "PLATFORM_ADMIN",
  institutionId: null,
  institutionRole: null,
};

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "institution-1",
  slug: "greenfield-technical-college",
  name: "Greenfield Technical College",
  type: "TECHNICAL_COLLEGE",
  status: "ACTIVE",
  contactEmail: "office@greenfield.example.com",
  contactPhone: null,
  website: null,
  addressLine: null,
  city: null,
  country: null,
  archivedAt: null,
  createdAt: new Date("2026-09-17T10:00:00Z"),
  updatedAt: new Date("2026-09-17T10:00:00Z"),
  ...overrides,
});

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "7.10.0",
  });

describe("InstitutionsService", () => {
  let service: InstitutionsService;
  let access: { assertPlatformAdmin: AsyncMock; assertCanView: AsyncMock; assertCanManage: AsyncMock };
  let prisma: {
    institution: { findMany: AsyncMock; count: AsyncMock; create: AsyncMock; update: AsyncMock };
    membership: { findMany: AsyncMock; findUnique: AsyncMock; update: AsyncMock; count: AsyncMock };
    enrolment: { updateMany: AsyncMock };
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    access = { assertPlatformAdmin: fn(), assertCanView: fn(), assertCanManage: fn() };
    prisma = {
      institution: { findMany: fn(), count: fn(), create: fn(), update: fn() },
      membership: { findMany: fn(), findUnique: fn(), update: fn(), count: fn() },
      enrolment: { updateMany: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn((work: unknown) =>
        Array.isArray(work)
          ? Promise.all(work as Promise<unknown>[])
          : (work as (tx: unknown) => Promise<unknown>)(prisma),
      ),
    };
    prisma.institution.findMany.mockResolvedValue([]);
    prisma.institution.create.mockImplementation((args) =>
      Promise.resolve(row((args as { data: Record<string, unknown> }).data)),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        InstitutionsService,
        { provide: InstitutionAccessService, useValue: access },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(InstitutionsService);
  });

  const input = {
    name: "Greenfield Technical College",
    type: "TECHNICAL_COLLEGE" as const,
    contactEmail: "Office@Greenfield.Example.com",
  };

  describe("create", () => {
    it("confirms the platform role against the database first", async () => {
      access.assertPlatformAdmin.mockRejectedValue(new ForbiddenException());

      await expect(service.create(admin, input)).rejects.toThrow(ForbiddenException);
      expect(prisma.institution.create).not.toHaveBeenCalled();
    });

    it("creates an active institution with a slug from its name and a normalised email", async () => {
      const created = await service.create(admin, input);

      expect(prisma.institution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: "greenfield-technical-college",
          status: "ACTIVE",
          contactEmail: "office@greenfield.example.com",
        }),
      });
      expect(created).not.toHaveProperty("archivedAt");
    });

    it("takes the next free slug when the name is already in use", async () => {
      prisma.institution.findMany.mockResolvedValue([
        { slug: "greenfield-technical-college" },
        { slug: "greenfield-technical-college-2" },
      ]);

      await service.create(admin, input);

      expect(prisma.institution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ slug: "greenfield-technical-college-3" }),
      });
    });

    it("retries with a random suffix when a concurrent create takes the slug", async () => {
      prisma.institution.create
        .mockRejectedValueOnce(uniqueViolation())
        .mockImplementationOnce((args) =>
          Promise.resolve(row((args as { data: Record<string, unknown> }).data)),
        );

      const created = await service.create(admin, input);

      expect(created.slug).toMatch(/^greenfield-technical-college-[0-9a-f]{6}$/);
    });

    it("records who created it", async () => {
      await service.create(admin, input);

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorUserId: "admin-1",
          action: "institution.created",
          institutionId: "institution-1",
        }),
      });
    });
  });

  describe("list", () => {
    it("pages through unarchived institutions, filtered by status and name", async () => {
      prisma.institution.findMany.mockResolvedValue([row()]);
      prisma.institution.count.mockResolvedValue(21);

      const result = await service.list(admin, {
        page: 2,
        pageSize: 10,
        status: "ACTIVE",
        search: "green",
      });

      const where = {
        archivedAt: null,
        status: "ACTIVE",
        name: { contains: "green", mode: "insensitive" },
      };
      expect(prisma.institution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where, skip: 10, take: 10, orderBy: { name: "asc" } }),
      );
      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.pagination).toEqual({ page: 2, pageSize: 10, totalItems: 21, totalPages: 3 });
    });
  });

  describe("update", () => {
    it("lets an institution admin change contact details", async () => {
      access.assertCanManage.mockResolvedValue({ institution: row(), isPlatformAdmin: false });
      prisma.institution.update.mockResolvedValue(row({ city: "North Campus" }));

      await service.update(admin, "institution-1", { city: "North Campus" });

      expect(prisma.institution.update).toHaveBeenCalledWith({
        where: { id: "institution-1" },
        data: { city: "North Campus" },
      });
    });

    it("reserves changing the institution type for a platform admin", async () => {
      access.assertCanManage.mockResolvedValue({ institution: row(), isPlatformAdmin: false });

      await expect(
        service.update(admin, "institution-1", { type: "UNIVERSITY" }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.institution.update).not.toHaveBeenCalled();
    });

    it("audits which fields changed", async () => {
      access.assertCanManage.mockResolvedValue({ institution: row(), isPlatformAdmin: true });
      prisma.institution.update.mockResolvedValue(row({ type: "UNIVERSITY" }));

      await service.update(admin, "institution-1", { type: "UNIVERSITY" });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "institution.updated",
          metadata: { fields: ["type"] },
        }),
      });
    });
  });

  describe("listMembers", () => {
    it("checks the caller may manage the institution before reading anyone", async () => {
      access.assertCanManage.mockRejectedValue(new ForbiddenException());

      await expect(service.listMembers(admin, "institution-1")).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.membership.findMany).not.toHaveBeenCalled();
    });

    it("lists active members of that institution only", async () => {
      access.assertCanManage.mockResolvedValue({});
      prisma.membership.findMany.mockResolvedValue([
        {
          role: "LEARNER",
          joinedAt: new Date("2026-09-20T10:00:00Z"),
          user: {
            id: "user-2",
            firstName: "Ada",
            lastName: "Obi",
            email: "ada@example.com",
            _count: { enrolments: 2 },
          },
        },
      ]);

      await expect(service.listMembers(admin, "institution-1")).resolves.toEqual([
        {
          userId: "user-2",
          firstName: "Ada",
          lastName: "Obi",
          email: "ada@example.com",
          role: "LEARNER",
          joinedAt: new Date("2026-09-20T10:00:00Z"),
          openEnrolments: 2,
        },
      ]);

      const [args] = prisma.membership.findMany.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      // An invited or suspended membership is not someone who can be enrolled.
      expect(args.where).toEqual({ institutionId: "institution-1", status: "ACTIVE" });
    });
  });

  describe("listMembers' open enrolments", () => {
    it("counts only this institution's open cohort places, for the removal warning", async () => {
      access.assertCanManage.mockResolvedValue({});
      prisma.membership.findMany.mockResolvedValue([]);

      await service.listMembers(admin, "institution-1");

      const [args] = prisma.membership.findMany.mock.calls[0] as [
        { select: { user: { select: { _count: { select: { enrolments: { where: unknown } } } } } } },
      ];
      // Another institution's places are not this one's to withdraw, and a
      // finished or withdrawn one is not open.
      expect(args.select.user.select._count.select.enrolments.where).toEqual({
        institutionId: "institution-1",
        status: { in: ["INVITED", "ACTIVE"] },
      });
    });
  });

  describe("removeMember", () => {
    const learnerMembership = { id: "membership-2", role: "LEARNER", status: "ACTIVE" };

    beforeEach(() => {
      access.assertCanManage.mockResolvedValue({});
      prisma.membership.findUnique.mockResolvedValue(learnerMembership);
      prisma.membership.update.mockResolvedValue({});
      prisma.enrolment.updateMany.mockResolvedValue({ count: 2 });
      prisma.membership.count.mockResolvedValue(1);
    });

    it("checks the caller may manage the institution before touching anyone", async () => {
      access.assertCanManage.mockRejectedValue(new ForbiddenException());

      await expect(service.removeMember(admin, "institution-1", "user-2")).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.membership.update).not.toHaveBeenCalled();
    });

    it("marks the membership LEFT rather than deleting it, so the record stays", async () => {
      await service.removeMember(admin, "institution-1", "user-2");

      const [args] = prisma.membership.update.mock.calls[0] as [
        { where: { id: string }; data: { status: string } },
      ];
      expect(args).toMatchObject({ where: { id: "membership-2" }, data: { status: "LEFT" } });
    });

    it("withdraws their open enrolments here, and nowhere else", async () => {
      const result = await service.removeMember(admin, "institution-1", "user-2");

      const [args] = prisma.enrolment.updateMany.mock.calls[0] as [
        { where: Record<string, unknown>; data: { status: string; withdrawnAt: Date } },
      ];
      // Completed enrolments are untouched: they record work actually done.
      expect(args.where).toEqual({
        userId: "user-2",
        institutionId: "institution-1",
        status: { in: ["INVITED", "ACTIVE"] },
      });
      expect(args.data.status).toBe("WITHDRAWN");
      expect(args.data.withdrawnAt).toBeInstanceOf(Date);
      expect(result).toMatchObject({ userId: "user-2", enrolmentsWithdrawn: 2 });
    });

    it("records who removed whom, and what it withdrew", async () => {
      await service.removeMember(admin, "institution-1", "user-2");

      const [args] = prisma.auditEvent.create.mock.calls[0] as [
        { data: { action: string; actorUserId: string; metadata: Record<string, unknown> } },
      ];
      expect(args.data).toMatchObject({
        action: "membership.removed",
        actorUserId: "admin-1",
        metadata: { userId: "user-2", role: "LEARNER", enrolmentsWithdrawn: 2 },
      });
    });

    it("refuses to remove the last administrator, which would leave nobody to run it", async () => {
      prisma.membership.findUnique.mockResolvedValue({
        id: "membership-1",
        role: "INSTITUTION_ADMIN",
        status: "ACTIVE",
      });
      prisma.membership.count.mockResolvedValue(0);

      await expect(service.removeMember(admin, "institution-1", "user-1")).rejects.toMatchObject({
        response: { code: "LAST_ADMINISTRATOR" },
      });
      expect(prisma.membership.update).not.toHaveBeenCalled();
    });

    it("lets an administrator go when another remains, themselves included", async () => {
      prisma.membership.findUnique.mockResolvedValue({
        id: "membership-1",
        role: "INSTITUTION_ADMIN",
        status: "ACTIVE",
      });
      prisma.membership.count.mockResolvedValue(1);

      await service.removeMember(admin, "institution-1", "admin-1");

      const [args] = prisma.membership.count.mock.calls[0] as [{ where: Record<string, unknown> }];
      // Counts the *other* active administrators.
      expect(args.where).toMatchObject({
        institutionId: "institution-1",
        role: "INSTITUTION_ADMIN",
        status: "ACTIVE",
        userId: { not: "admin-1" },
      });
      expect(prisma.membership.update).toHaveBeenCalled();
    });

    it("treats removing someone already gone as done, not an error", async () => {
      prisma.membership.findUnique.mockResolvedValue({ ...learnerMembership, status: "LEFT" });

      await expect(service.removeMember(admin, "institution-1", "user-2")).resolves.toMatchObject({
        enrolmentsWithdrawn: 0,
      });
      expect(prisma.membership.update).not.toHaveBeenCalled();
      expect(prisma.auditEvent.create).not.toHaveBeenCalled();
    });

    it("is a 404 for someone who was never a member here", async () => {
      prisma.membership.findUnique.mockResolvedValue(null);

      await expect(service.removeMember(admin, "institution-1", "user-9")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

