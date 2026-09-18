import { jest } from "@jest/globals";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import { PasswordService } from "../auth/password.service.js";
import { UsersService } from "./users.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const user: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "tunde@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "LEARNER",
};

const learnerProfile = {
  id: "profile-1",
  userId: "user-1",
  state: "EXPLORER",
  phone: null,
  dateOfBirth: new Date("2004-03-09T00:00:00Z"),
  gender: null,
  educationLevel: "SECONDARY",
  employmentStatus: null,
  location: null,
  bio: null,
  goals: "Start a greenhouse enterprise",
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const account = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  email: "tunde@example.com",
  firstName: "Tunde",
  lastName: "Bello",
  passwordHash: "$argon2id$current",
  platformRole: "NONE",
  emailVerifiedAt: new Date("2026-09-17T10:00:00Z"),
  lastLoginAt: null,
  deactivatedAt: null,
  createdAt: new Date("2026-09-17T10:00:00Z"),
  updatedAt: new Date("2026-09-17T10:00:00Z"),
  learnerProfile,
  ...overrides,
});

describe("UsersService", () => {
  let service: UsersService;
  let passwords: { verify: AsyncMock; hash: AsyncMock };
  let mail: { sendPasswordChanged: AsyncMock };
  let prisma: {
    user: { findUnique: AsyncMock; update: AsyncMock };
    learnerProfile: { update: AsyncMock };
    authSession: { findUnique: AsyncMock; updateMany: AsyncMock };
    passwordResetToken: { updateMany: AsyncMock };
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: (tx: unknown) => Promise<unknown>) => Promise<unknown>>;
  };

  beforeEach(async () => {
    passwords = { verify: fn(), hash: fn() };
    mail = { sendPasswordChanged: fn() };
    prisma = {
      user: { findUnique: fn(), update: fn() },
      learnerProfile: { update: fn() },
      authSession: { findUnique: fn(), updateMany: fn() },
      passwordResetToken: { updateMany: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn((work: (tx: unknown) => Promise<unknown>) => work(prisma)),
    };
    prisma.user.findUnique.mockResolvedValue(account());
    prisma.user.update.mockResolvedValue(account());
    mail.sendPasswordChanged.mockResolvedValue("SENT");

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordService, useValue: passwords },
        { provide: MailService, useValue: mail },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => "http://localhost:3001" },
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe("getProfile", () => {
    it("returns the account and learner profile, never the password hash", async () => {
      const profile = await service.getProfile(user);

      expect(profile).toMatchObject({
        email: "tunde@example.com",
        firstName: "Tunde",
        learnerProfile: {
          state: "EXPLORER",
          dateOfBirth: "2004-03-09",
          goals: "Start a greenhouse enterprise",
        },
      });
      expect(JSON.stringify(profile)).not.toContain("argon2");
    });

    it("returns a null learner profile for staff", async () => {
      prisma.user.findUnique.mockResolvedValue(account({ learnerProfile: null }));

      await expect(service.getProfile(user)).resolves.toMatchObject({ learnerProfile: null });
    });

    it("ends access for a deactivated account", async () => {
      prisma.user.findUnique.mockResolvedValue(account({ deactivatedAt: new Date() }));

      await expect(service.getProfile(user)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("updateProfile", () => {
    it("updates names and learner details together", async () => {
      await service.updateProfile(user, {
        firstName: "Babatunde",
        learnerProfile: { location: "North Campus", dateOfBirth: "2004-03-10", bio: "" },
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-1" }, data: { firstName: "Babatunde" } }),
      );
      expect(prisma.learnerProfile.update).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        data: {
          location: "North Campus",
          dateOfBirth: new Date("2004-03-10T00:00:00.000Z"),
          // An emptied field is cleared, not stored as "".
          bio: null,
        },
      });
    });

    it("refuses learner details for an account with no learner profile", async () => {
      prisma.user.findUnique.mockResolvedValue(account({ learnerProfile: null }));

      await expect(
        service.updateProfile(user, { learnerProfile: { location: "North Campus" } }),
      ).rejects.toMatchObject({ response: { code: "NOT_A_LEARNER" } });
      expect(prisma.learnerProfile.update).not.toHaveBeenCalled();
    });

    it("refuses a date of birth in the future, in the validation error shape", async () => {
      await expect(
        service.updateProfile(user, { learnerProfile: { dateOfBirth: "2999-01-01" } }),
      ).rejects.toMatchObject({
        response: { message: ["dateOfBirth must be a real date in the past"] },
      });
    });
  });

  describe("changePassword", () => {
    beforeEach(() => {
      prisma.authSession.findUnique.mockResolvedValue({
        id: "session-1",
        familyId: "family-current",
        revokedAt: null,
      });
      passwords.hash.mockResolvedValue("$argon2id$new");
    });

    it("answers a wrong current password with 400, not 401, so the session is not mistaken for expired", async () => {
      passwords.verify.mockResolvedValue(false);

      await expect(
        service.changePassword(user, { currentPassword: "wrong", newPassword: "a new long passphrase" }),
      ).rejects.toMatchObject({ status: 400, response: { code: "CURRENT_PASSWORD_INCORRECT" } });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("refuses a new password identical to the current one", async () => {
      passwords.verify.mockResolvedValue(true);

      await expect(
        service.changePassword(user, { currentPassword: "same long passphrase", newPassword: "same long passphrase" }),
      ).rejects.toMatchObject({ response: { code: "PASSWORD_UNCHANGED" } });
    });

    it("changes the password, keeps this device signed in, and signs out the rest", async () => {
      passwords.verify.mockResolvedValue(true);

      await service.changePassword(user, {
        currentPassword: "the old long passphrase",
        newPassword: "a new long passphrase",
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { passwordHash: "$argon2id$new" },
      });
      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", revokedAt: null, familyId: { not: "family-current" } },
        data: { revokedAt: expect.any(Date) },
      });
      // A reset link sent before the change must not undo it.
      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(mail.sendPasswordChanged).toHaveBeenCalledWith(
        expect.objectContaining({ to: "tunde@example.com", signedOut: "other-devices" }),
      );
    });

    it("refuses when the current session has already ended", async () => {
      passwords.verify.mockResolvedValue(true);
      prisma.authSession.findUnique.mockResolvedValue({ id: "session-1", familyId: "f", revokedAt: new Date() });

      await expect(
        service.changePassword(user, { currentPassword: "old long passphrase", newPassword: "a new long passphrase" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
