import { jest } from "@jest/globals";
import {
  GoneException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import { RateLimitService } from "../../lib/rate-limit/rate-limit.service.js";
import { AuthService } from "./auth.service.js";
import { PasswordService } from "./password.service.js";
import { TokenService } from "./token.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const settings: Record<string, unknown> = {
  JWT_REFRESH_SECRET: "refresh-secret-that-is-long-enough-ok",
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_DAYS: 30,
  REFRESH_REUSE_GRACE_SECONDS: 30,
  PASSWORD_RESET_TTL_MINUTES: 60,
  WEBAPP_URL: "http://localhost:3001",
  LOGIN_MAX_FAILURES: 8,
  LOGIN_THROTTLE_WINDOW_SECONDS: 900,
  PASSWORD_RESET_MAX_REQUESTS: 5,
  PASSWORD_RESET_THROTTLE_WINDOW_SECONDS: 3600,
};

const client = { userAgent: "jest", ipAddress: "127.0.0.1" };

const user = {
  id: "user-1",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Obi",
  passwordHash: "$argon2id$stored",
  platformRole: "NONE",
  deactivatedAt: null as Date | null,
};

const membership = (institutionId: string, role = "LEARNER", kind = "STANDARD") => ({
  institutionId,
  role,
  institution: {
    id: institutionId,
    name: `Institution ${institutionId}`,
    slug: institutionId,
    kind,
  },
});

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000);
const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000);

describe("AuthService", () => {
  let service: AuthService;
  let tokens: TokenService;
  let passwords: { hash: AsyncMock; verify: AsyncMock; verifyAgainstDummy: AsyncMock };
  let mail: { sendPasswordReset: AsyncMock; sendPasswordChanged: AsyncMock };
  let throttle: { assertNotBlocked: AsyncMock; recordAttempt: AsyncMock; clear: AsyncMock };
  let prisma: {
    user: { findUnique: AsyncMock; update: AsyncMock };
    membership: { findMany: AsyncMock };
    authSession: { findUnique: AsyncMock; create: AsyncMock; update: AsyncMock; updateMany: AsyncMock };
    passwordResetToken: { findUnique: AsyncMock; create: AsyncMock; updateMany: AsyncMock };
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: (tx: unknown) => Promise<unknown>) => Promise<unknown>>;
  };

  beforeEach(async () => {
    passwords = { hash: fn(), verify: fn(), verifyAgainstDummy: fn() };
    mail = { sendPasswordReset: fn(), sendPasswordChanged: fn() };
    throttle = { assertNotBlocked: fn(), recordAttempt: fn(), clear: fn() };
    prisma = {
      user: { findUnique: fn(), update: fn() },
      membership: { findMany: fn() },
      authSession: { findUnique: fn(), create: fn(), update: fn(), updateMany: fn() },
      passwordResetToken: { findUnique: fn(), create: fn(), updateMany: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn((work: (tx: unknown) => Promise<unknown>) => work(prisma)),
    };

    prisma.membership.findMany.mockResolvedValue([membership("institution-1")]);
    prisma.authSession.create.mockImplementation((args) =>
      Promise.resolve({
        id: "session-new",
        ...(args as { data: Record<string, unknown> }).data,
      }),
    );
    mail.sendPasswordReset.mockResolvedValue("SENT");
    mail.sendPasswordChanged.mockResolvedValue("SENT");
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

    const config = {
      get: (key: string) => settings[key],
      getOrThrow: (key: string) => settings[key],
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenService,
        { provide: JwtService, useValue: new JwtService({ secret: "access-secret-long-enough-for-tests" }) },
        { provide: ConfigService, useValue: config },
        { provide: PasswordService, useValue: passwords },
        { provide: MailService, useValue: mail },
        { provide: RateLimitService, useValue: throttle },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    tokens = moduleRef.get(TokenService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe("login", () => {
    it("starts a session and returns tokens for valid credentials", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(true);

      const result = await service.login(
        { email: "ada@example.com", password: "correct horse" },
        client,
      );

      expect(result.refreshToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(prisma.authSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          tokenHash: tokens.hashToken(result.refreshToken),
          activeInstitutionId: "institution-1",
          userAgent: "jest",
        }),
      });
      expect(result.activeInstitutionId).toBe("institution-1");
      expect(result.institutionRole).toBe("LEARNER");
      expect(result.memberships).toEqual([
        {
          institutionId: "institution-1",
          institutionName: "Institution institution-1",
          institutionSlug: "institution-1",
          role: "LEARNER",
          independentLearners: false,
        },
      ]);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it("looks the email up trimmed and lower-cased", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(true);

      await service.login({ email: "  Ada@Example.COM ", password: "correct horse" }, client);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "ada@example.com" },
      });
    });

    it("spends a real hash verification on an unknown email, then refuses", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      passwords.verifyAgainstDummy.mockResolvedValue(false);

      await expect(
        service.login({ email: "nobody@example.com", password: "whatever" }, client),
      ).rejects.toMatchObject({ response: { code: "INVALID_CREDENTIALS" } });
      expect(passwords.verifyAgainstDummy).toHaveBeenCalledWith("whatever");
      expect(prisma.authSession.create).not.toHaveBeenCalled();
    });

    it("gives a wrong password the same answer as an unknown email", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(false);

      await expect(
        service.login({ email: "ada@example.com", password: "wrong" }, client),
      ).rejects.toMatchObject({ response: { code: "INVALID_CREDENTIALS" } });
    });

    it("refuses a deactivated account only once the password is proven", async () => {
      prisma.user.findUnique.mockResolvedValue({ ...user, deactivatedAt: new Date() });
      passwords.verify.mockResolvedValue(true);

      await expect(
        service.login({ email: "ada@example.com", password: "correct horse" }, client),
      ).rejects.toMatchObject({ response: { code: "ACCOUNT_DEACTIVATED" } });
    });

    it("refuses a throttled account before spending an Argon2 verification on it", async () => {
      throttle.assertNotBlocked.mockRejectedValue(new Error("TOO_MANY_ATTEMPTS"));

      await expect(
        service.login({ email: "ada@example.com", password: "correct horse" }, client),
      ).rejects.toThrow("TOO_MANY_ATTEMPTS");
      expect(passwords.verify).not.toHaveBeenCalled();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("charges a failed attempt to the account, not to whoever asked", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(false);

      await expect(
        service.login({ email: "  Ada@Example.com ", password: "wrong" }, client),
      ).rejects.toMatchObject({ response: { code: "INVALID_CREDENTIALS" } });

      const [rule, keys] = throttle.recordAttempt.mock.calls[0] as [
        { scope: string; limit: number },
        string[],
      ];
      expect(rule.scope).toBe("login");
      // Normalised, so "Ada@Example.com" and "ada@example.com" share a budget.
      expect(keys).toContain("ada@example.com");
    });

    it("charges an unknown email too, so guessing addresses is throttled as well", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      passwords.verifyAgainstDummy.mockResolvedValue(false);

      await expect(
        service.login({ email: "nobody@example.com", password: "whatever" }, client),
      ).rejects.toMatchObject({ response: { code: "INVALID_CREDENTIALS" } });
      expect(throttle.recordAttempt).toHaveBeenCalled();
    });

    it("charges a forwarded address too, but on a far looser budget", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(false);

      await expect(
        service.login(
          { email: "ada@example.com", password: "wrong" },
          { ...client, forwardedFor: "203.0.113.5" },
        ),
      ).rejects.toThrow();

      const charges = throttle.recordAttempt.mock.calls as Array<
        [{ limit: number }, string[]]
      >;
      const [accountRule, accountKeys] = charges[0];
      const [addressRule, addressKeys] = charges[1];

      expect(accountKeys).toEqual(["ada@example.com"]);
      expect(addressKeys).toEqual(["203.0.113.5"]);
      /*
        A shared address — a campus, an office, a phone network — carries every
        one of its users' mistakes. On the account's budget of 8, one careless
        afternoon would lock the whole building out of the product.
      */
      expect(addressRule.limit).toBeGreaterThan(accountRule.limit * 5);
    });

    it("keys only on the account when nothing was forwarded, so one web app cannot lock everyone out", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(false);

      await expect(
        service.login({ email: "ada@example.com", password: "wrong" }, { userAgent: "jest" }),
      ).rejects.toThrow();

      expect(throttle.recordAttempt).toHaveBeenCalledTimes(1);
      const [, keys] = throttle.recordAttempt.mock.calls[0] as [unknown, string[]];
      expect(keys).toEqual(["ada@example.com"]);
    });

    it("checks both keys before doing any work", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(true);

      await service.login(
        { email: "ada@example.com", password: "correct horse" },
        { ...client, forwardedFor: "203.0.113.5" },
      );

      expect(throttle.assertNotBlocked).toHaveBeenCalledWith("login", [
        "ada@example.com",
        "203.0.113.5",
      ]);
    });

    it("forgets the failures once the right password is given", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(true);

      await service.login({ email: "ada@example.com", password: "correct horse" }, client);

      expect(throttle.clear).toHaveBeenCalledWith("login", ["ada@example.com"]);
      expect(throttle.recordAttempt).not.toHaveBeenCalled();
    });

    it("does not charge an attempt when the password was right but the account is deactivated", async () => {
      prisma.user.findUnique.mockResolvedValue({ ...user, deactivatedAt: new Date() });
      passwords.verify.mockResolvedValue(true);

      await expect(
        service.login({ email: "ada@example.com", password: "correct horse" }, client),
      ).rejects.toMatchObject({ response: { code: "ACCOUNT_DEACTIVATED" } });
      expect(throttle.recordAttempt).not.toHaveBeenCalled();
    });

    it("signs the active institution role into the access token", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(true);
      prisma.membership.findMany.mockResolvedValue([membership("institution-9", "INSTITUTION_ADMIN")]);

      const result = await service.login({ email: "ada@example.com", password: "x" }, client);
      const claims = await new JwtService({ secret: "access-secret-long-enough-for-tests" })
        .verifyAsync<Record<string, unknown>>(result.accessToken, { audience: "farmclub-os" });

      expect(claims).toMatchObject({
        sub: "user-1",
        sid: "session-new",
        institutionId: "institution-9",
        institutionRole: "INSTITUTION_ADMIN",
      });
    });
  });

  describe("refresh", () => {
    const raw = "a".repeat(43);
    const liveSession = () => ({
      id: "session-1",
      userId: "user-1",
      familyId: "family-1",
      tokenHash: tokens.hashToken(raw),
      expiresAt: minutesFromNow(60),
      revokedAt: null as Date | null,
      replacedById: null as string | null,
      activeInstitutionId: "institution-1",
    });

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(user);
    });

    it("rotates a live token to its derived successor", async () => {
      prisma.authSession.findUnique.mockResolvedValue(liveSession());
      prisma.authSession.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.refresh(raw, client);

      const successor = tokens.deriveSuccessorToken(raw);
      expect(result.refreshToken).toBe(successor);
      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: { id: "session-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.authSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          familyId: "family-1",
          tokenHash: tokens.hashToken(successor),
          activeInstitutionId: "institution-1",
        }),
      });
      expect(prisma.authSession.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { replacedById: "session-new" },
      });
    });

    it("rejects a token it has never issued", async () => {
      prisma.authSession.findUnique.mockResolvedValue(null);

      await expect(service.refresh(raw, client)).rejects.toMatchObject({
        response: { code: "INVALID_REFRESH_TOKEN" },
      });
    });

    it("rejects an expired token", async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        ...liveSession(),
        expiresAt: secondsAgo(1),
      });

      await expect(service.refresh(raw, client)).rejects.toMatchObject({
        response: { code: "REFRESH_TOKEN_EXPIRED" },
      });
    });

    it("hands back the same successor inside the grace window, without rotating again", async () => {
      const successorRaw = tokens.deriveSuccessorToken(raw);
      prisma.authSession.findUnique.mockImplementation((args) => {
        const where = (args as { where: { id?: string; tokenHash?: string } }).where;
        if (where.id === "session-2") {
          return Promise.resolve({
            ...liveSession(),
            id: "session-2",
            tokenHash: tokens.hashToken(successorRaw),
          });
        }
        return Promise.resolve({
          ...liveSession(),
          revokedAt: secondsAgo(5),
          replacedById: "session-2",
        });
      });

      const result = await service.refresh(raw, client);

      expect(result.refreshToken).toBe(successorRaw);
      expect(prisma.authSession.create).not.toHaveBeenCalled();
      expect(prisma.authSession.updateMany).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { familyId: "family-1", revokedAt: null } }),
      );
    });

    it("treats a rotated token replayed after the grace window as theft and ends the family", async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        ...liveSession(),
        revokedAt: secondsAgo(120),
        replacedById: "session-2",
      });

      await expect(service.refresh(raw, client)).rejects.toMatchObject({
        response: { code: "REFRESH_TOKEN_REUSED" },
      });
      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: { familyId: "family-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("rejects a signed-out token without raising a theft alarm", async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        ...liveSession(),
        revokedAt: secondsAgo(5),
        replacedById: null,
      });
      const warn = jest.spyOn(Logger.prototype, "warn");

      await expect(service.refresh(raw, client)).rejects.toMatchObject({
        response: { code: "INVALID_REFRESH_TOKEN" },
      });
      expect(warn).not.toHaveBeenCalled();
    });

    it("falls back to the grace path when a concurrent request wins the rotation", async () => {
      const successorRaw = tokens.deriveSuccessorToken(raw);
      let reads = 0;
      prisma.authSession.findUnique.mockImplementation((args) => {
        const where = (args as { where: { id?: string } }).where;
        if (where.id === "session-2") {
          return Promise.resolve({
            ...liveSession(),
            id: "session-2",
            tokenHash: tokens.hashToken(successorRaw),
          });
        }
        reads += 1;
        // First read: still live. Re-read after losing the race: rotated.
        return Promise.resolve(
          reads === 1
            ? liveSession()
            : { ...liveSession(), revokedAt: secondsAgo(0), replacedById: "session-2" },
        );
      });
      prisma.authSession.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.refresh(raw, client);

      expect(result.refreshToken).toBe(successorRaw);
      expect(prisma.authSession.create).not.toHaveBeenCalled();
    });

    it("ends the family when the account has since been deactivated", async () => {
      prisma.authSession.findUnique.mockResolvedValue(liveSession());
      prisma.user.findUnique.mockResolvedValue({ ...user, deactivatedAt: new Date() });

      await expect(service.refresh(raw, client)).rejects.toThrow(UnauthorizedException);
      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: { familyId: "family-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("moves off an institution the user no longer belongs to", async () => {
      prisma.authSession.findUnique.mockResolvedValue(liveSession());
      prisma.authSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.membership.findMany.mockResolvedValue([membership("institution-2")]);

      const result = await service.refresh(raw, client);

      expect(result.activeInstitutionId).toBe("institution-2");
      expect(prisma.authSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ activeInstitutionId: "institution-2" }),
      });
    });
  });

  describe("logout", () => {
    it("ends the whole session family, so every rotated token dies with it", async () => {
      prisma.authSession.findUnique.mockResolvedValue({ id: "session-1", familyId: "family-1" });

      await service.logout("a".repeat(43));

      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: { familyId: "family-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("succeeds quietly for an unknown token", async () => {
      prisma.authSession.findUnique.mockResolvedValue(null);

      await expect(service.logout("a".repeat(43))).resolves.toBeUndefined();
      expect(prisma.authSession.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("getSessionContext", () => {
    const authenticated: AuthenticatedUser = {
      userId: "user-1",
      sessionId: "session-1",
      email: "ada@example.com",
      platformRole: "NONE",
      institutionId: "institution-1",
      institutionRole: "LEARNER",
    };

    it("reads memberships from the database rather than trusting the token", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      // Suspended since the token was issued: no longer an active membership.
      prisma.membership.findMany.mockResolvedValue([membership("institution-2", "MENTOR")]);

      const context = await service.getSessionContext(authenticated);

      expect(context.user.email).toBe("ada@example.com");
      expect(context.activeInstitutionId).toBeNull();
      expect(context.institutionRole).toBeNull();
      expect(context.memberships.map((m) => m.institutionId)).toEqual(["institution-2"]);
    });

    it("keeps the token's institution while the membership is still active", async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      const context = await service.getSessionContext(authenticated);

      expect(context.activeInstitutionId).toBe("institution-1");
      expect(context.institutionRole).toBe("LEARNER");
    });

    it("says which membership is learning independently, so it is never shown as an institution", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.membership.findMany.mockResolvedValue([
        membership("institution-1"),
        membership("home-1", "LEARNER", "INDEPENDENT_LEARNERS"),
      ]);

      const context = await service.getSessionContext(authenticated);

      expect(context.memberships.map((m) => m.independentLearners)).toEqual([false, true]);
    });

    it("ends a session whose account has been deactivated", async () => {
      prisma.user.findUnique.mockResolvedValue({ ...user, deactivatedAt: new Date() });

      await expect(service.getSessionContext(authenticated)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("switchInstitution", () => {
    const authenticated: AuthenticatedUser = {
      userId: "user-1",
      sessionId: "session-1",
      email: "ada@example.com",
      platformRole: "NONE",
      institutionId: "institution-1",
      institutionRole: "LEARNER",
    };

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.membership.findMany.mockResolvedValue([
        membership("institution-1"),
        membership("institution-2", "FACILITATOR"),
      ]);
    });

    it("moves the session to another institution the user belongs to", async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        id: "session-1",
        revokedAt: null,
        expiresAt: minutesFromNow(60),
      });

      const result = await service.switchInstitution(authenticated, "institution-2");

      expect(prisma.authSession.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { activeInstitutionId: "institution-2" },
      });
      expect(result.activeInstitutionId).toBe("institution-2");
      expect(result.institutionRole).toBe("FACILITATOR");
      expect(result.accessToken).toEqual(expect.any(String));
    });

    it("answers 404 for an institution the user does not belong to", async () => {
      await expect(
        service.switchInstitution(authenticated, "institution-99"),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.authSession.update).not.toHaveBeenCalled();
    });

    it("refuses when the session has already ended", async () => {
      prisma.authSession.findUnique.mockResolvedValue({
        id: "session-1",
        revokedAt: new Date(),
        expiresAt: minutesFromNow(60),
      });

      await expect(
        service.switchInstitution(authenticated, "institution-2"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("requestPasswordReset", () => {
    const flush = () => new Promise((resolve) => setImmediate(resolve));

    it("issues a single-use token and emails a link carrying it", async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await service.requestPasswordReset("ada@example.com", {});
      await flush();

      const sent = mail.sendPasswordReset.mock.calls[0]?.[0] as { resetUrl: string };
      const raw = new URL(sent.resetUrl).searchParams.get("token") ?? "";

      expect(sent.resetUrl.startsWith("http://localhost:3001/reset-password?token=")).toBe(true);
      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: "user-1", tokenHash: tokens.hashToken(raw) }),
      });
    });

    it("charges every request, because the cost is an email in someone's inbox", async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await service.requestPasswordReset("ada@example.com", {});

      expect(throttle.assertNotBlocked).toHaveBeenCalledWith("password-reset", [
        "ada@example.com",
      ]);
      const [rule] = throttle.recordAttempt.mock.calls[0] as [{ scope: string }];
      expect(rule.scope).toBe("password-reset");
    });

    it("bounds the total from one address, so a list of emails is not a way round the limit", async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await service.requestPasswordReset("ada@example.com", { forwardedFor: "203.0.113.5" });

      const charges = throttle.recordAttempt.mock.calls as Array<[{ limit: number }, string[]]>;
      expect(charges[0]?.[1]).toEqual(["ada@example.com"]);
      expect(charges[1]?.[1]).toEqual(["203.0.113.5"]);
      expect(charges[1][0].limit).toBeGreaterThan(charges[0][0].limit * 5);
    });

    it("refuses once the inbox has had enough, before looking the account up", async () => {
      throttle.assertNotBlocked.mockRejectedValue(new Error("TOO_MANY_ATTEMPTS"));

      await expect(service.requestPasswordReset("ada@example.com", {})).rejects.toThrow(
        "TOO_MANY_ATTEMPTS",
      );
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("does nothing, and says nothing, for an unknown email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.requestPasswordReset("nobody@example.com", {})).resolves.toBeUndefined();
      await flush();

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it("sends nothing to a deactivated account", async () => {
      prisma.user.findUnique.mockResolvedValue({ ...user, deactivatedAt: new Date() });

      await service.requestPasswordReset("ada@example.com", {});
      await flush();

      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    const raw = "r".repeat(43);

    it("sets the new password, consumes the token and signs out every device", async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "reset-1",
        userId: "user-1",
        usedAt: null,
        expiresAt: minutesFromNow(30),
        user,
      });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      passwords.hash.mockResolvedValue("$argon2id$new");

      await service.resetPassword(raw, "a brand new password");

      expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: tokens.hashToken(raw) },
        include: { user: true },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { passwordHash: "$argon2id$new" },
      });
      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(mail.sendPasswordChanged).toHaveBeenCalledWith(
        expect.objectContaining({ to: "ada@example.com", userId: "user-1" }),
      );
      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: "user.password_reset" }),
      });
    });

    /*
      An account made on the server has no password until its link is used,
      and the same reset link sets the first one. Using the emailed link proves
      the address, as accepting an invitation does. Nothing was changed, so no
      "your password was changed" email follows.
    */
    it("sets a first password, verifying the email, without saying it was changed", async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "reset-1",
        userId: "user-1",
        usedAt: null,
        expiresAt: minutesFromNow(30),
        user: { ...user, passwordHash: null },
      });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      passwords.hash.mockResolvedValue("$argon2id$first");

      await service.resetPassword(raw, "a brand new password");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { passwordHash: "$argon2id$first", emailVerifiedAt: expect.any(Date) },
      });
      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: "user.password_set" }),
      });
      expect(mail.sendPasswordChanged).not.toHaveBeenCalled();
    });

    it.each([
      ["unknown", null],
      ["used", { usedAt: new Date(), expiresAt: minutesFromNow(30) }],
      ["expired", { usedAt: null, expiresAt: secondsAgo(1) }],
    ])("rejects a %s token", async (_, record) => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(
        record ? { id: "reset-1", userId: "user-1", user, ...record } : null,
      );

      await expect(service.resetPassword(raw, "a brand new password")).rejects.toThrow(
        GoneException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("rejects the loser when the same token is redeemed twice at once", async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "reset-1",
        userId: "user-1",
        usedAt: null,
        expiresAt: minutesFromNow(30),
        user,
      });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      passwords.hash.mockResolvedValue("$argon2id$new");

      await expect(service.resetPassword(raw, "a brand new password")).rejects.toThrow(
        GoneException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
