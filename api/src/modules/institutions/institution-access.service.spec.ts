import { jest } from "@jest/globals";
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { InstitutionAccessService } from "./institution-access.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const user: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "ada@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "INSTITUTION_ADMIN",
};

const institution = { id: "institution-1", status: "ACTIVE", archivedAt: null };

describe("InstitutionAccessService", () => {
  let access: InstitutionAccessService;
  let prisma: {
    user: { findUnique: AsyncMock };
    institution: { findFirst: AsyncMock };
    membership: { findUnique: AsyncMock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: fn() },
      institution: { findFirst: fn() },
      membership: { findUnique: fn() },
    };
    prisma.user.findUnique.mockResolvedValue({ platformRole: "NONE", deactivatedAt: null });
    prisma.institution.findFirst.mockResolvedValue(institution);

    const moduleRef = await Test.createTestingModule({
      providers: [InstitutionAccessService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    access = moduleRef.get(InstitutionAccessService);
  });

  describe("assertCanManage", () => {
    it("allows an active institution admin, checked against the database", async () => {
      prisma.membership.findUnique.mockResolvedValue({ role: "INSTITUTION_ADMIN", status: "ACTIVE" });

      await expect(access.assertCanManage(user, "institution-1")).resolves.toEqual({
        institution,
        isPlatformAdmin: false,
      });
    });

    it("allows a platform admin with no membership at all", async () => {
      prisma.user.findUnique.mockResolvedValue({ platformRole: "PLATFORM_ADMIN", deactivatedAt: null });
      prisma.membership.findUnique.mockResolvedValue(null);

      await expect(access.assertCanManage(user, "institution-1")).resolves.toMatchObject({
        isPlatformAdmin: true,
      });
    });

    it("forbids a member without the admin role, since they know it exists", async () => {
      prisma.membership.findUnique.mockResolvedValue({ role: "LEARNER", status: "ACTIVE" });

      await expect(access.assertCanManage(user, "institution-1")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("answers 404 to a non-member, so the id is not confirmed", async () => {
      prisma.membership.findUnique.mockResolvedValue(null);

      await expect(access.assertCanManage(user, "institution-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("ignores the token's role once the membership is suspended in the database", async () => {
      // The token still says INSTITUTION_ADMIN; the database has moved on.
      prisma.membership.findUnique.mockResolvedValue({ role: "INSTITUTION_ADMIN", status: "SUSPENDED" });

      await expect(access.assertCanManage(user, "institution-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("ignores a platform role the token still carries after demotion", async () => {
      const staleToken = { ...user, platformRole: "PLATFORM_ADMIN" as const };
      prisma.membership.findUnique.mockResolvedValue(null);

      await expect(access.assertCanManage(staleToken, "institution-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("answers 404 for an archived or unknown institution, even to a platform admin", async () => {
      prisma.user.findUnique.mockResolvedValue({ platformRole: "PLATFORM_ADMIN", deactivatedAt: null });
      prisma.institution.findFirst.mockResolvedValue(null);

      await expect(access.assertCanManage(user, "institution-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("ends access for an account deactivated since the token was issued", async () => {
      prisma.user.findUnique.mockResolvedValue({ platformRole: "NONE", deactivatedAt: new Date() });

      await expect(access.assertCanManage(user, "institution-1")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("assertCanView", () => {
    it("allows any active member, whatever their role", async () => {
      prisma.membership.findUnique.mockResolvedValue({ role: "LEARNER", status: "ACTIVE" });

      await expect(access.assertCanView(user, "institution-1")).resolves.toMatchObject({
        institution,
      });
    });

    it("hides a suspended institution from its members but not from a platform admin", async () => {
      prisma.institution.findFirst.mockResolvedValue({ ...institution, status: "SUSPENDED" });
      prisma.membership.findUnique.mockResolvedValue({ role: "LEARNER", status: "ACTIVE" });

      await expect(access.assertCanView(user, "institution-1")).rejects.toThrow(
        NotFoundException,
      );

      prisma.user.findUnique.mockResolvedValue({ platformRole: "PLATFORM_ADMIN", deactivatedAt: null });
      await expect(access.assertCanView(user, "institution-1")).resolves.toMatchObject({
        isPlatformAdmin: true,
      });
    });
  });

  describe("assertPlatformAdmin", () => {
    it("forbids a user whose platform role has been removed in the database", async () => {
      await expect(
        access.assertPlatformAdmin({ ...user, platformRole: "PLATFORM_ADMIN" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
