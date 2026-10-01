import { jest } from "@jest/globals";
import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import { TokenService } from "../auth/token.service.js";
import { InstitutionAccessService } from "../institutions/institution-access.service.js";
import { ContentTeamService } from "./content-team.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const HOUR = 60 * 60 * 1000;

const admin: AuthenticatedUser = {
  userId: "admin-1",
  sessionId: "session-1",
  email: "pat@example.com",
  platformRole: "PLATFORM_ADMIN",
  institutionId: null,
  institutionRole: null,
};

const invitedBy = { id: "admin-1", firstName: "Pat", lastName: "Admin" };

const teamInvite = (overrides: Record<string, unknown> = {}) => ({
  id: "invite-1",
  institutionId: null,
  role: null,
  platformRole: "CONTENT_MANAGER",
  email: "maker@example.com",
  tokenHash: "hash:old",
  status: "PENDING",
  expiresAt: new Date(Date.now() + 24 * HOUR),
  invitedById: "admin-1",
  acceptedAt: null,
  acceptedById: null,
  revokedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  invitedBy,
  ...overrides,
});

const account = (overrides: Record<string, unknown> = {}) => ({
  id: "user-2",
  firstName: "Mo",
  lastName: "Maker",
  email: "mo@example.com",
  platformRole: "CONTENT_MANAGER",
  ...overrides,
});

/*
  The content team, as a platform administrator runs it: who is on it, the
  invitations still open, and taking someone off it. Using an invitation is
  the invites module's; these are the platform administrator's side.
*/
describe("ContentTeamService", () => {
  let service: ContentTeamService;
  let access: { assertPlatformAdmin: AsyncMock };
  let mail: { sendContentTeamInvite: AsyncMock };
  let prisma: {
    user: Record<"findMany" | "findUnique" | "update", AsyncMock>;
    invite: Record<"findMany" | "findFirst" | "create" | "update" | "updateMany", AsyncMock>;
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    access = { assertPlatformAdmin: fn() };
    mail = { sendContentTeamInvite: fn() };
    prisma = {
      user: { findMany: fn(), findUnique: fn(), update: fn() },
      invite: { findMany: fn(), findFirst: fn(), create: fn(), update: fn(), updateMany: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn((work: unknown) => (work as (tx: unknown) => Promise<unknown>)(prisma)),
    };

    access.assertPlatformAdmin.mockResolvedValue(undefined);
    mail.sendContentTeamInvite.mockResolvedValue("SENT");
    prisma.invite.create.mockImplementation((args) =>
      Promise.resolve(teamInvite((args as { data: Record<string, unknown> }).data)),
    );
    prisma.invite.update.mockImplementation((args) =>
      Promise.resolve(teamInvite((args as { data: Record<string, unknown> }).data)),
    );
    prisma.invite.updateMany.mockResolvedValue({ count: 0 });
    prisma.user.update.mockImplementation((args) =>
      Promise.resolve(account((args as { data: Record<string, unknown> }).data)),
    );

    const settings: Record<string, unknown> = {
      INVITE_TTL_HOURS: 168,
      WEBAPP_URL: "http://localhost:3001",
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentTeamService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { getOrThrow: (key: string) => settings[key] } },
        { provide: InstitutionAccessService, useValue: access },
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

    service = moduleRef.get(ContentTeamService);
  });

  it("is for platform administrators only, checked against the database each time", async () => {
    access.assertPlatformAdmin.mockRejectedValue(new ForbiddenException({ code: "INSUFFICIENT_ROLE" }));

    for (const attempt of [
      () => service.list(admin),
      () => service.invite(admin, { email: "maker@example.com" }),
      () => service.resend(admin, "invite-1"),
      () => service.revoke(admin, "invite-1"),
      () => service.remove(admin, "user-2"),
    ]) {
      await expect(attempt()).rejects.toBeInstanceOf(ForbiddenException);
    }
    expect(prisma.invite.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  describe("list", () => {
    it("shows who is on the team, administrators first, and the invitations still open", async () => {
      prisma.user.findMany.mockResolvedValue([
        account({ id: "admin-1", firstName: "Pat", lastName: "Admin", email: "pat@example.com", platformRole: "PLATFORM_ADMIN" }),
        account(),
      ]);
      prisma.invite.findMany.mockResolvedValue([
        teamInvite(),
        teamInvite({ id: "invite-2", email: "late@example.com", expiresAt: new Date(Date.now() - HOUR) }),
      ]);

      const team = await service.list(admin);

      expect(team.members).toEqual([
        { id: "admin-1", firstName: "Pat", lastName: "Admin", email: "pat@example.com", platformRole: "PLATFORM_ADMIN" },
        { id: "user-2", firstName: "Mo", lastName: "Maker", email: "mo@example.com", platformRole: "CONTENT_MANAGER" },
      ]);
      // A lapsed invitation is shown as expired, so it can be resent.
      expect(team.invitations.map((invite) => [invite.email, invite.status])).toEqual([
        ["maker@example.com", "PENDING"],
        ["late@example.com", "EXPIRED"],
      ]);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { platformRole: { in: ["PLATFORM_ADMIN", "CONTENT_MANAGER"] }, deactivatedAt: null },
        }),
      );
      expect(prisma.invite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { platformRole: "CONTENT_MANAGER", status: { in: ["PENDING", "EXPIRED"] } },
        }),
      );
    });
  });

  describe("invite", () => {
    it("emails a content-manager invitation, replacing any still open for that address", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const issued = await service.invite(admin, { email: "  Maker@Example.com " });

      expect(prisma.invite.updateMany).toHaveBeenCalledWith({
        where: { platformRole: "CONTENT_MANAGER", email: "maker@example.com", status: "PENDING" },
        data: { status: "REVOKED", revokedAt: expect.any(Date) },
      });
      expect(prisma.invite.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            email: "maker@example.com",
            platformRole: "CONTENT_MANAGER",
            tokenHash: "hash:fresh-token",
            expiresAt: expect.any(Date),
            invitedById: "admin-1",
          },
        }),
      );
      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "invite.issued",
          actorUserId: "admin-1",
          metadata: { email: "maker@example.com", platformRole: "CONTENT_MANAGER" },
        }),
      });
      expect(mail.sendContentTeamInvite).toHaveBeenCalledWith({
        to: "maker@example.com",
        inviterName: "Pat Admin",
        expiresInDays: 7,
        acceptUrl: "http://localhost:3001/accept-invite?token=fresh-token",
      });
      expect(issued).toMatchObject({ email: "maker@example.com", status: "PENDING", emailStatus: "SENT" });
      // The token reaches only the inbox, never a response.
      expect(JSON.stringify(issued)).not.toContain("fresh-token");
    });

    it("invites someone who has an account but is not on the team", async () => {
      prisma.user.findUnique.mockResolvedValue(account({ platformRole: "NONE" }));

      await service.invite(admin, { email: "mo@example.com" });

      expect(prisma.invite.create).toHaveBeenCalled();
    });

    it.each(["CONTENT_MANAGER", "PLATFORM_ADMIN"])(
      "refuses someone already on the team as %s",
      async (platformRole) => {
        prisma.user.findUnique.mockResolvedValue(account({ platformRole }));

        const attempt = service.invite(admin, { email: "mo@example.com" });

        await expect(attempt).rejects.toBeInstanceOf(ConflictException);
        await expect(attempt).rejects.toMatchObject({ response: { code: "ALREADY_CONTENT_TEAM" } });
        expect(prisma.invite.create).not.toHaveBeenCalled();
      },
    );

    it("keeps the invitation when its email fails, and says so", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mail.sendContentTeamInvite.mockResolvedValue("FAILED");

      await expect(service.invite(admin, { email: "maker@example.com" })).resolves.toMatchObject({
        emailStatus: "FAILED",
      });
      expect(prisma.invite.create).toHaveBeenCalled();
    });
  });

  describe("resend", () => {
    it("gives a lapsed invitation a fresh link and expiry", async () => {
      prisma.invite.findFirst.mockResolvedValue(teamInvite({ expiresAt: new Date(Date.now() - HOUR) }));

      await expect(service.resend(admin, "invite-1")).resolves.toMatchObject({
        status: "PENDING",
        emailStatus: "SENT",
      });
      expect(prisma.invite.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "invite-1" },
          data: { tokenHash: "hash:fresh-token", expiresAt: expect.any(Date), status: "PENDING" },
        }),
      );
      expect(mail.sendContentTeamInvite).toHaveBeenCalled();
    });

    it("only ever finds a content-team invitation, never an institution's", async () => {
      prisma.invite.findFirst.mockResolvedValue(null);

      await expect(service.resend(admin, "invite-9")).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.invite.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "invite-9", platformRole: "CONTENT_MANAGER" } }),
      );
    });

    it.each(["ACCEPTED", "REVOKED"])("cannot resend one that was %s", async (status) => {
      prisma.invite.findFirst.mockResolvedValue(teamInvite({ status }));

      await expect(service.resend(admin, "invite-1")).rejects.toMatchObject({
        response: { code: "INVITE_NOT_PENDING" },
      });
    });
  });

  describe("revoke", () => {
    it("withdraws an open invitation", async () => {
      prisma.invite.findFirst.mockResolvedValue(teamInvite());

      await expect(service.revoke(admin, "invite-1")).resolves.toMatchObject({ status: "REVOKED" });
      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: "invite.revoked", entityId: "invite-1" }),
      });
    });

    it("treats revoking twice as done, recording nothing", async () => {
      prisma.invite.findFirst.mockResolvedValue(teamInvite({ status: "REVOKED" }));

      await expect(service.revoke(admin, "invite-1")).resolves.toMatchObject({ status: "REVOKED" });
      expect(prisma.invite.update).not.toHaveBeenCalled();
      expect(prisma.auditEvent.create).not.toHaveBeenCalled();
    });

    it("cannot revoke one that was accepted", async () => {
      prisma.invite.findFirst.mockResolvedValue(teamInvite({ status: "ACCEPTED" }));

      await expect(service.revoke(admin, "invite-1")).rejects.toMatchObject({
        response: { code: "INVITE_ALREADY_ACCEPTED" },
      });
    });
  });

  describe("remove", () => {
    it("takes the content-manager role away and keeps the account", async () => {
      prisma.user.findUnique.mockResolvedValue(account());

      await expect(service.remove(admin, "user-2")).resolves.toEqual({
        id: "user-2",
        firstName: "Mo",
        lastName: "Maker",
        email: "mo@example.com",
      });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-2" }, data: { platformRole: "NONE" } }),
      );
      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "content_team.member_removed",
          entityType: "User",
          entityId: "user-2",
          actorUserId: "admin-1",
        }),
      });
    });

    it("never removes a platform administrator, who is on the team by role", async () => {
      prisma.user.findUnique.mockResolvedValue(account({ platformRole: "PLATFORM_ADMIN" }));

      await expect(service.remove(admin, "user-2")).rejects.toMatchObject({
        response: { code: "PLATFORM_ADMIN_ON_TEAM" },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("treats removing someone already off the team as done, recording nothing", async () => {
      prisma.user.findUnique.mockResolvedValue(account({ platformRole: "NONE" }));

      await expect(service.remove(admin, "user-2")).resolves.toMatchObject({ id: "user-2" });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.auditEvent.create).not.toHaveBeenCalled();
    });

    it("answers 404 for an account that does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(admin, "user-9")).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
