import { jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
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
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    access = { assertPlatformAdmin: fn(), assertCanView: fn(), assertCanManage: fn() };
    prisma = {
      institution: { findMany: fn(), count: fn(), create: fn(), update: fn() },
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
});
