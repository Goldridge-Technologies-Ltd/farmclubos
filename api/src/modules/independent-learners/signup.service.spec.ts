import { jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import { RateLimitService } from "../../lib/rate-limit/rate-limit.service.js";
import { TokenService } from "../auth/token.service.js";
import { IndependentLearnersService } from "./independent-learners.service.js";
import { SignupService } from "./signup.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

/** The issuing happens after the answer is given; this lets it finish. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("SignupService", () => {
  let service: SignupService;
  let throttle: { assertNotBlocked: AsyncMock; recordAttempt: AsyncMock };
  let mail: { sendSignup: AsyncMock; sendAccountExists: AsyncMock };
  let independent: { home: AsyncMock };
  let prisma: {
    user: { findUnique: AsyncMock };
    invite: { updateMany: AsyncMock; create: AsyncMock };
    auditEvent: { create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    throttle = { assertNotBlocked: fn(), recordAttempt: fn() };
    mail = { sendSignup: fn(), sendAccountExists: fn() };
    independent = { home: fn() };
    prisma = {
      user: { findUnique: fn() },
      invite: { updateMany: fn(), create: fn() },
      auditEvent: { create: fn() },
      $transaction: jest.fn((work: unknown) => (work as (tx: unknown) => Promise<unknown>)(prisma)),
    };
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.invite.create.mockResolvedValue({ id: "invite-1" });
    independent.home.mockResolvedValue({ id: "home-1" });

    const settings: Record<string, unknown> = {
      SIGNUP_MAX_REQUESTS: 5,
      SIGNUP_THROTTLE_WINDOW_SECONDS: 3600,
      INVITE_TTL_HOURS: 168,
      WEBAPP_URL: "http://localhost:3001",
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SignupService,
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
        { provide: RateLimitService, useValue: throttle },
        { provide: IndependentLearnersService, useValue: independent },
      ],
    }).compile();

    service = moduleRef.get(SignupService);
  });

  it("invites a new address into the home, storing only the token's hash", async () => {
    await service.signUp("  Newcomer@Example.COM ", {});
    await flush();

    expect(prisma.invite.create).toHaveBeenCalledWith({
      data: {
        institutionId: "home-1",
        email: "newcomer@example.com",
        role: "LEARNER",
        tokenHash: "hash:fresh-token",
        expiresAt: expect.any(Date),
        invitedById: null,
      },
    });
    expect(mail.sendSignup).toHaveBeenCalledWith({
      to: "newcomer@example.com",
      institutionId: "home-1",
      expiresInDays: 7,
      finishUrl: "http://localhost:3001/accept-invite?token=fresh-token",
    });
  });

  it("lets only the newest link work, as with any invitation", async () => {
    await service.signUp("newcomer@example.com", {});
    await flush();

    expect(prisma.invite.updateMany).toHaveBeenCalledWith({
      where: { institutionId: "home-1", email: "newcomer@example.com", status: "PENDING" },
      data: { status: "REVOKED", revokedAt: expect.any(Date) },
    });
  });

  it("records the request, with nobody as its actor", async () => {
    await service.signUp("newcomer@example.com", {});
    await flush();

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        institutionId: "home-1",
        action: "signup.requested",
        entityType: "Invite",
        entityId: "invite-1",
      },
    });
  });

  /*
    The form answers the same whatever the address. Only the owner of the
    inbox learns the account exists, and nothing about it changes.
  */
  it("emails an address that already has an account a way to sign in instead", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user-7", firstName: "Ada", deactivatedAt: null });

    await expect(service.signUp("ada@example.com", {})).resolves.toBeUndefined();
    await flush();

    expect(mail.sendAccountExists).toHaveBeenCalledWith({
      to: "ada@example.com",
      userId: "user-7",
      firstName: "Ada",
      signInUrl: "http://localhost:3001/sign-in",
    });
    expect(prisma.invite.create).not.toHaveBeenCalled();
    expect(mail.sendSignup).not.toHaveBeenCalled();
  });

  it("emails nothing about a deactivated account", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-7",
      firstName: "Ada",
      deactivatedAt: new Date(),
    });

    await service.signUp("ada@example.com", {});
    await flush();

    expect(mail.sendAccountExists).not.toHaveBeenCalled();
    expect(prisma.invite.create).not.toHaveBeenCalled();
  });

  it("answers without waiting on the address's lookup, so timing reveals nothing", async () => {
    let release: (value: null) => void = () => undefined;
    prisma.user.findUnique.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    await expect(service.signUp("newcomer@example.com", {})).resolves.toBeUndefined();
    expect(prisma.invite.create).not.toHaveBeenCalled();

    release(null);
    await flush();
    expect(prisma.invite.create).toHaveBeenCalled();
  });

  it("charges every request, because the cost is an email in someone's inbox", async () => {
    await service.signUp("newcomer@example.com", {});

    expect(throttle.assertNotBlocked).toHaveBeenCalledWith("signup", ["newcomer@example.com"]);
    const [rule, keys] = throttle.recordAttempt.mock.calls[0] as [
      { scope: string; limit: number; windowSeconds: number },
      string[],
    ];
    expect(rule).toMatchObject({ scope: "signup", limit: 5, windowSeconds: 3600 });
    expect(keys).toEqual(["newcomer@example.com"]);
  });

  it("bounds the total from one address, so a list of emails is not a way round the limit", async () => {
    await service.signUp("newcomer@example.com", { forwardedFor: "203.0.113.5" });

    const charges = throttle.recordAttempt.mock.calls as Array<[{ limit: number }, string[]]>;
    expect(charges[1]?.[1]).toEqual(["203.0.113.5"]);
    expect(charges[1][0].limit).toBeGreaterThan(charges[0][0].limit * 5);
  });

  it("refuses once the limit is reached, before anything is sent", async () => {
    throttle.assertNotBlocked.mockRejectedValue(new Error("TOO_MANY_ATTEMPTS"));

    await expect(service.signUp("newcomer@example.com", {})).rejects.toThrow("TOO_MANY_ATTEMPTS");
    await flush();

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mail.sendSignup).not.toHaveBeenCalled();
  });
});
