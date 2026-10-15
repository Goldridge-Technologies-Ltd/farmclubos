import { jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import { TokenService } from "../auth/token.service.js";
import { PlatformAdminsService } from "./platform-admins.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const HOUR = 60 * 60 * 1000;

const account = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Obi",
  passwordHash: "argon2-hash",
  platformRole: "NONE",
  deactivatedAt: null,
  ...overrides,
});

/** The `data` a mock was last called with. */
const dataOf = (mock: AsyncMock, call = 0) =>
  (mock.mock.calls[call]?.[0] as { data: Record<string, unknown> }).data;

/*
  Platform administrators are made on the server, never through the web app:
  someone with the server's environment runs the command, and the service does
  the work. A new account gets no password, only an emailed link to set one,
  so no password is typed, stored or printed on the server.
*/
describe("PlatformAdminsService", () => {
  let service: PlatformAdminsService;
  let mail: { sendPlatformAdminWelcome: AsyncMock };
  let prisma: {
    user: Record<"findUnique" | "create" | "update", AsyncMock>;
    passwordResetToken: Record<"create" | "updateMany", AsyncMock>;
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    mail = { sendPlatformAdminWelcome: fn() };
    prisma = {
      user: { findUnique: fn(), create: fn(), update: fn() },
      passwordResetToken: { create: fn(), updateMany: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn((work: unknown) => (work as (tx: unknown) => Promise<unknown>)(prisma)),
    };

    mail.sendPlatformAdminWelcome.mockResolvedValue("SENT");
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation((args) =>
      Promise.resolve(
        account({ id: "user-new", ...(args as { data: Record<string, unknown> }).data }),
      ),
    );
    prisma.user.update.mockImplementation((args) =>
      Promise.resolve(account((args as { data: Record<string, unknown> }).data)),
    );
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    const settings: Record<string, unknown> = {
      INVITE_TTL_HOURS: 168,
      WEBAPP_URL: "https://app.farmclubos.com",
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PlatformAdminsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { getOrThrow: (key: string) => settings[key] } },
        {
          provide: TokenService,
          useValue: {
            generateOpaqueToken: () => "fresh-token",
            hashToken: (token: string) => `hash:${token}`,
          },
        },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = moduleRef.get(PlatformAdminsService);
  });

  describe("a new account", () => {
    it("is created as a platform administrator with no password", async () => {
      await service.add({ email: "  Ada@Example.com ", firstName: "Ada", lastName: "Obi" });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "ada@example.com" } });
      expect(dataOf(prisma.user.create)).toEqual({
        email: "ada@example.com",
        firstName: "Ada",
        lastName: "Obi",
        platformRole: "PLATFORM_ADMIN",
      });
    });

    it("is emailed a link to set its password, lasting as long as an invitation", async () => {
      const before = Date.now();

      const result = await service.add({ email: "ada@example.com", firstName: "Ada", lastName: "Obi" });

      const token = dataOf(prisma.passwordResetToken.create);
      expect(token).toMatchObject({ userId: "user-new", tokenHash: "hash:fresh-token" });
      expect((token.expiresAt as Date).getTime()).toBeGreaterThanOrEqual(before + 168 * HOUR);

      expect(mail.sendPlatformAdminWelcome).toHaveBeenCalledWith({
        to: "ada@example.com",
        userId: "user-new",
        firstName: "Ada",
        expiresInDays: 7,
        setPasswordUrl: "https://app.farmclubos.com/reset-password?token=fresh-token",
      });
      expect(result).toEqual({
        email: "ada@example.com",
        created: true,
        granted: true,
        reactivated: false,
        passwordLink: { emailStatus: "SENT", expiresInDays: 7 },
      });
    });

    it("records who was made an administrator, with no actor: it was done on the server", async () => {
      await service.add({ email: "ada@example.com", firstName: "Ada", lastName: "Obi" });

      expect(dataOf(prisma.auditEvent.create)).toEqual({
        actorUserId: null,
        action: "user.platform_admin_granted",
        entityType: "User",
        entityId: "user-new",
        metadata: { via: "command", created: true },
      });
    });

    it("reports an email that did not send, so the command can say to run it again", async () => {
      mail.sendPlatformAdminWelcome.mockResolvedValue("FAILED");

      const result = await service.add({ email: "ada@example.com", firstName: "Ada", lastName: "Obi" });

      expect(result.created).toBe(true);
      expect(result.passwordLink).toEqual({ emailStatus: "FAILED", expiresInDays: 7 });
    });

    it("needs a first and last name, refusing before anything is written", async () => {
      await expect(service.add({ email: "ada@example.com" })).rejects.toThrow(BadRequestException);
      await expect(
        service.add({ email: "ada@example.com", firstName: "Ada", lastName: "  " }),
      ).rejects.toThrow(/first and last name/);

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(mail.sendPlatformAdminWelcome).not.toHaveBeenCalled();
    });
  });

  describe("an existing account", () => {
    it("becomes a platform administrator, keeping its password and its names", async () => {
      prisma.user.findUnique.mockResolvedValue(account({ platformRole: "CONTENT_MANAGER" }));

      const result = await service.add({ email: "ada@example.com", firstName: "Someone", lastName: "Else" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { platformRole: "PLATFORM_ADMIN", deactivatedAt: null },
      });
      expect(dataOf(prisma.auditEvent.create).metadata).toEqual({
        via: "command",
        previousRole: "CONTENT_MANAGER",
        reactivated: false,
      });
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mail.sendPlatformAdminWelcome).not.toHaveBeenCalled();
      expect(result).toEqual({
        email: "ada@example.com",
        created: false,
        granted: true,
        reactivated: false,
        passwordLink: null,
      });
    });

    it("is made active again if it was deactivated, and says so", async () => {
      prisma.user.findUnique.mockResolvedValue(account({ deactivatedAt: new Date() }));

      const result = await service.add({ email: "ada@example.com" });

      expect(dataOf(prisma.user.update)).toEqual({ platformRole: "PLATFORM_ADMIN", deactivatedAt: null });
      expect(result).toMatchObject({ granted: true, reactivated: true });
    });

    it("is left alone when it is already an active platform administrator", async () => {
      prisma.user.findUnique.mockResolvedValue(account({ platformRole: "PLATFORM_ADMIN" }));

      const result = await service.add({ email: "ada@example.com" });

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.auditEvent.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        email: "ada@example.com",
        created: false,
        granted: false,
        reactivated: false,
        passwordLink: null,
      });
    });

    it("without a password yet gets a fresh link, and only the newest link works", async () => {
      prisma.user.findUnique.mockResolvedValue(
        account({ platformRole: "PLATFORM_ADMIN", passwordHash: null }),
      );

      const result = await service.add({ email: "ada@example.com" });

      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(dataOf(prisma.passwordResetToken.create)).toMatchObject({ userId: "user-1" });
      expect(mail.sendPlatformAdminWelcome).toHaveBeenCalledWith(
        expect.objectContaining({ to: "ada@example.com", userId: "user-1" }),
      );
      expect(prisma.auditEvent.create).not.toHaveBeenCalled();
      expect(result).toMatchObject({ granted: false, passwordLink: { emailStatus: "SENT" } });
    });
  });
});
