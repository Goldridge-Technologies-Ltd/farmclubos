import { jest } from "@jest/globals";
import {
  ConflictException,
  GoneException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { Prisma } from "../../generated/prisma/client.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import { AuthService } from "../auth/auth.service.js";
import { PasswordService } from "../auth/password.service.js";
import { TokenService } from "../auth/token.service.js";
import { InstitutionAccessService } from "../institutions/institution-access.service.js";
import { InvitesService } from "./invites.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const HOUR = 60 * 60 * 1000;

const admin: AuthenticatedUser = {
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "INSTITUTION_ADMIN",
};

const institution = {
  id: "institution-1",
  name: "Greenfield Technical College",
  slug: "greenfield-technical-college",
  status: "ACTIVE",
  archivedAt: null,
};

const invitedBy = { id: "admin-1", firstName: "Ada", lastName: "Obi" };

const inviteRow = (overrides: Record<string, unknown> = {}) => ({
  id: "invite-1",
  institutionId: "institution-1",
  email: "learner@example.com",
  role: "LEARNER",
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
  institution,
  ...overrides,
});

describe("InvitesService", () => {
  let service: InvitesService;
  let access: { assertCanManage: AsyncMock };
  let auth: { startSession: AsyncMock };
  let mail: { sendInvite: AsyncMock };
  let passwords: { hash: AsyncMock };
  let prisma: {
    invite: Record<"findUnique" | "findFirst" | "findMany" | "count" | "create" | "update" | "updateMany", AsyncMock>;
    membership: Record<"findFirst" | "findUnique" | "upsert", AsyncMock>;
    user: Record<"findUnique" | "create", AsyncMock>;
    learnerProfile: Record<"findUnique" | "create", AsyncMock>;
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    access = { assertCanManage: fn() };
    auth = { startSession: fn() };
    mail = { sendInvite: fn() };
    passwords = { hash: fn() };
    prisma = {
      invite: {
        findUnique: fn(), findFirst: fn(), findMany: fn(), count: fn(),
        create: fn(), update: fn(), updateMany: fn(),
      },
      membership: { findFirst: fn(), findUnique: fn(), upsert: fn() },
      user: { findUnique: fn(), create: fn() },
      learnerProfile: { findUnique: fn(), create: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn((work: unknown) =>
        Array.isArray(work)
          ? Promise.all(work as Promise<unknown>[])
          : (work as (tx: unknown) => Promise<unknown>)(prisma),
      ),
    };

    access.assertCanManage.mockResolvedValue({ institution, isPlatformAdmin: false });
    mail.sendInvite.mockResolvedValue("SENT");
    passwords.hash.mockResolvedValue("$argon2id$hash");
    prisma.invite.create.mockImplementation((args) =>
      Promise.resolve(inviteRow((args as { data: Record<string, unknown> }).data)),
    );
    prisma.invite.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.create.mockResolvedValue({ id: "user-new" });
    auth.startSession.mockResolvedValue({ accessToken: "access" });

    const settings: Record<string, unknown> = {
      INVITE_TTL_HOURS: 168,
      WEBAPP_URL: "http://localhost:3001",
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InvitesService,
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
        { provide: PasswordService, useValue: passwords },
        { provide: AuthService, useValue: auth },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = moduleRef.get(InvitesService);
  });

  describe("issue", () => {
    it("replaces any pending invite, stores only the token hash, and emails the raw token", async () => {
      prisma.membership.findFirst.mockResolvedValue(null);

      const issued = await service.issue(admin, "institution-1", {
        email: "  Learner@Example.com ",
        role: "LEARNER",
      });

      expect(access.assertCanManage).toHaveBeenCalledWith(admin, "institution-1");
      expect(prisma.invite.updateMany).toHaveBeenCalledWith({
        where: { institutionId: "institution-1", email: "learner@example.com", status: "PENDING" },
        data: { status: "REVOKED", revokedAt: expect.any(Date) },
      });
      const created = (prisma.invite.create.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
      expect(created).toMatchObject({
        email: "learner@example.com",
        role: "LEARNER",
        tokenHash: "hash:fresh-token",
        invitedById: "admin-1",
      });
      expect((created.expiresAt as Date).getTime() - Date.now()).toBeGreaterThan(167 * HOUR);
      expect(mail.sendInvite).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "learner@example.com",
          inviterName: "Ada Obi",
          acceptUrl: "http://localhost:3001/accept-invite?token=fresh-token",
          expiresInDays: 7,
        }),
      );
      expect(issued).toMatchObject({ email: "learner@example.com", emailStatus: "SENT" });
      expect(issued).not.toHaveProperty("tokenHash");
      expect(JSON.stringify(issued)).not.toContain("fresh-token");
    });

    it("refuses someone who is already an active member", async () => {
      prisma.membership.findFirst.mockResolvedValue({ id: "membership-1" });

      await expect(
        service.issue(admin, "institution-1", { email: "learner@example.com", role: "LEARNER" }),
      ).rejects.toMatchObject({ response: { code: "ALREADY_MEMBER" } });
      expect(prisma.invite.create).not.toHaveBeenCalled();
    });

    it("refuses to invite into a suspended institution, even for a platform admin", async () => {
      access.assertCanManage.mockResolvedValue({
        institution: { ...institution, status: "SUSPENDED" },
        isPlatformAdmin: true,
      });

      await expect(
        service.issue(admin, "institution-1", { email: "learner@example.com", role: "LEARNER" }),
      ).rejects.toMatchObject({ response: { code: "INSTITUTION_UNAVAILABLE" } });
    });

    it("keeps the invite when the email fails, and says so", async () => {
      prisma.membership.findFirst.mockResolvedValue(null);
      mail.sendInvite.mockResolvedValue("FAILED");

      const issued = await service.issue(admin, "institution-1", {
        email: "learner@example.com",
        role: "LEARNER",
      });

      expect(prisma.invite.create).toHaveBeenCalled();
      expect(issued.emailStatus).toBe("FAILED");
    });
  });

  describe("list", () => {
    it("excludes lapsed invites from PENDING and reports them as EXPIRED", async () => {
      prisma.invite.findMany.mockResolvedValue([inviteRow({ expiresAt: new Date(Date.now() - HOUR) })]);
      prisma.invite.count.mockResolvedValue(1);

      const pending = await service.list(admin, "institution-1", { page: 1, pageSize: 20, status: "PENDING" });
      expect(prisma.invite.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { institutionId: "institution-1", status: "PENDING", expiresAt: { gt: expect.any(Date) } },
        }),
      );

      await service.list(admin, "institution-1", { page: 1, pageSize: 20, status: "EXPIRED" });
      expect(prisma.invite.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: {
            institutionId: "institution-1",
            OR: [{ status: "EXPIRED" }, { status: "PENDING", expiresAt: { lte: expect.any(Date) } }],
          },
        }),
      );

      expect(pending.items[0]?.status).toBe("EXPIRED");
    });
  });

  describe("resend", () => {
    it("only finds an invite inside the institution in the path", async () => {
      prisma.invite.findFirst.mockResolvedValue(null);

      await expect(service.resend(admin, "institution-1", "invite-9")).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.invite.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "invite-9", institutionId: "institution-1" } }),
      );
    });

    it("issues a fresh token and expiry for a lapsed invite", async () => {
      prisma.invite.findFirst.mockResolvedValue(inviteRow({ expiresAt: new Date(Date.now() - HOUR) }));
      prisma.invite.update.mockResolvedValue(inviteRow({ tokenHash: "hash:fresh-token" }));

      const resent = await service.resend(admin, "institution-1", "invite-1");

      expect(prisma.invite.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "invite-1" },
          data: expect.objectContaining({ tokenHash: "hash:fresh-token", status: "PENDING" }),
        }),
      );
      expect(resent.emailStatus).toBe("SENT");
    });

    it.each(["ACCEPTED", "REVOKED"])("refuses to resend an invite that is %s", async (status) => {
      prisma.invite.findFirst.mockResolvedValue(inviteRow({ status }));

      await expect(service.resend(admin, "institution-1", "invite-1")).rejects.toMatchObject({
        response: { code: "INVITE_NOT_PENDING" },
      });
    });
  });

  describe("revoke", () => {
    it("revokes a pending invite", async () => {
      prisma.invite.findFirst.mockResolvedValue(inviteRow());
      prisma.invite.update.mockResolvedValue(inviteRow({ status: "REVOKED", revokedAt: new Date() }));

      const revoked = await service.revoke(admin, "institution-1", "invite-1");

      expect(revoked.status).toBe("REVOKED");
      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: "invite.revoked" }),
      });
    });

    it("cannot revoke an invite that has been accepted", async () => {
      prisma.invite.findFirst.mockResolvedValue(inviteRow({ status: "ACCEPTED" }));

      await expect(service.revoke(admin, "institution-1", "invite-1")).rejects.toThrow(
        ConflictException,
      );
    });

    it("treats revoking twice as done", async () => {
      prisma.invite.findFirst.mockResolvedValue(inviteRow({ status: "REVOKED", revokedAt: new Date() }));

      await expect(service.revoke(admin, "institution-1", "invite-1")).resolves.toMatchObject({
        status: "REVOKED",
      });
      expect(prisma.invite.update).not.toHaveBeenCalled();
    });
  });

  describe("lookup", () => {
    it("describes a usable invite and whether its email already has an account", async () => {
      prisma.invite.findUnique.mockResolvedValue(inviteRow());
      prisma.user.findUnique.mockResolvedValue({ id: "user-7" });

      await expect(service.lookup("raw-token")).resolves.toEqual({
        email: "learner@example.com",
        role: "LEARNER",
        expiresAt: expect.any(Date),
        accountExists: true,
        institution: { id: "institution-1", name: "Greenfield Technical College" },
      });
      expect(prisma.invite.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tokenHash: "hash:raw-token" } }),
      );
    });

    it.each([
      ["unknown", null, NotFoundException, "INVITE_NOT_FOUND"],
      ["accepted", { status: "ACCEPTED" }, ConflictException, "INVITE_ALREADY_ACCEPTED"],
      ["revoked", { status: "REVOKED" }, GoneException, "INVITE_REVOKED"],
      ["expired", { expiresAt: new Date(Date.now() - HOUR) }, GoneException, "INVITE_EXPIRED"],
      ["for a suspended institution", { institution: { ...institution, status: "SUSPENDED" } }, GoneException, "INSTITUTION_UNAVAILABLE"],
    ])("rejects an invite that is %s", async (_, overrides, type, code) => {
      prisma.invite.findUnique.mockResolvedValue(overrides ? inviteRow(overrides) : null);

      const attempt = service.lookup("raw-token");

      await expect(attempt).rejects.toThrow(type);
      await expect(attempt).rejects.toMatchObject({ response: { code } });
    });

    it("records an invite as EXPIRED the first time a lapsed one is presented", async () => {
      prisma.invite.findUnique.mockResolvedValue(inviteRow({ expiresAt: new Date(Date.now() - HOUR) }));

      await expect(service.lookup("raw-token")).rejects.toThrow(GoneException);
      expect(prisma.invite.update).toHaveBeenCalledWith({
        where: { id: "invite-1" },
        data: { status: "EXPIRED" },
      });
    });
  });

  describe("accept", () => {
    const body = {
      token: "raw-token",
      firstName: "Tunde",
      lastName: "Bello",
      password: "a long new passphrase",
    };
    const client = { userAgent: "jest" };

    beforeEach(() => {
      prisma.invite.findUnique.mockResolvedValue(inviteRow());
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.learnerProfile.findUnique.mockResolvedValue(null);
    });

    it("creates a verified account, an active membership and a learner profile, then signs in", async () => {
      await expect(service.accept(body, client)).resolves.toEqual({ accessToken: "access" });

      expect(prisma.invite.updateMany).toHaveBeenCalledWith({
        where: { id: "invite-1", status: "PENDING" },
        data: { status: "ACCEPTED", acceptedAt: expect.any(Date) },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "learner@example.com",
          firstName: "Tunde",
          lastName: "Bello",
          passwordHash: "$argon2id$hash",
          emailVerifiedAt: expect.any(Date),
        },
      });
      expect(prisma.membership.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ userId: "user-new", role: "LEARNER", status: "ACTIVE" }),
        }),
      );
      expect(prisma.learnerProfile.create).toHaveBeenCalledWith({
        data: {
          userId: "user-new",
          state: "EXPLORER",
          stateChanges: { create: { toState: "EXPLORER", reason: "Joined through an invitation" } },
        },
      });
      expect(auth.startSession).toHaveBeenCalledWith("user-new", "institution-1", client);
    });

    it("creates no learner profile for a staff role", async () => {
      prisma.invite.findUnique.mockResolvedValue(inviteRow({ role: "FACILITATOR" }));

      await service.accept(body, client);

      expect(prisma.learnerProfile.create).not.toHaveBeenCalled();
    });

    it("sends someone who already has an account to sign in instead", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-7" });

      await expect(service.accept(body, client)).rejects.toMatchObject({
        response: { code: "ACCOUNT_EXISTS" },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("lets only one of two simultaneous acceptances through", async () => {
      prisma.invite.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.accept(body, client)).rejects.toMatchObject({
        response: { code: "INVITE_ALREADY_ACCEPTED" },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("turns a concurrent sign-up with the same email into ACCOUNT_EXISTS", async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "7.10.0",
        }),
      );

      await expect(service.accept(body, client)).rejects.toMatchObject({
        response: { code: "ACCOUNT_EXISTS" },
      });
      expect(auth.startSession).not.toHaveBeenCalled();
    });
  });

  describe("join", () => {
    const learner: AuthenticatedUser = { ...admin, userId: "user-7", institutionId: null, institutionRole: null };

    beforeEach(() => {
      prisma.invite.findUnique.mockResolvedValue(inviteRow());
      prisma.user.findUnique.mockResolvedValue({ id: "user-7", email: "learner@example.com", deactivatedAt: null });
      prisma.membership.findUnique.mockResolvedValue(null);
      prisma.learnerProfile.findUnique.mockResolvedValue({ id: "profile-7" });
    });

    it("adds the membership to the signed-in account the invite was sent to", async () => {
      await expect(service.join(learner, "raw-token")).resolves.toEqual({
        institutionId: "institution-1",
        institutionName: "Greenfield Technical College",
        institutionSlug: "greenfield-technical-college",
        role: "LEARNER",
      });
      expect(prisma.membership.upsert).toHaveBeenCalled();
      // An existing learner profile is reused, not duplicated.
      expect(prisma.learnerProfile.create).not.toHaveBeenCalled();
    });

    it("answers 404 when the invite was sent to a different email", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-7", email: "someone-else@example.com", deactivatedAt: null });

      await expect(service.join(learner, "raw-token")).rejects.toThrow(NotFoundException);
      expect(prisma.invite.updateMany).not.toHaveBeenCalled();
    });

    it("leaves the invite unused for someone already an active member", async () => {
      prisma.membership.findUnique.mockResolvedValue({ status: "ACTIVE" });

      await expect(service.join(learner, "raw-token")).rejects.toMatchObject({
        response: { code: "ALREADY_MEMBER" },
      });
      expect(prisma.invite.updateMany).not.toHaveBeenCalled();
    });
  });
});
