import {
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { normalizeEmail } from "../../common/utils/normalize-email.js";
import { webappLink } from "../../common/utils/webapp-link.js";
import type { AuthSession, User } from "../../generated/prisma/client.js";
import type { InstitutionKind, InstitutionRole } from "../../generated/prisma/enums.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import {
  RateLimitService,
  type RateLimitRule,
} from "../../lib/rate-limit/rate-limit.service.js";
import type {
  AuthSessionResult,
  ClientContext,
  MembershipSummary,
  SessionContext,
  SessionUser,
  SwitchedInstitution,
} from "./auth.types.js";
import { PasswordService } from "./password.service.js";
import { TokenService } from "./token.service.js";

type ActiveMembership = {
  institutionId: string;
  role: InstitutionRole;
  institution: { id: string; name: string; slug: string; kind: InstitutionKind };
};

const LOGIN_SCOPE = "login";
const PASSWORD_RESET_SCOPE = "password-reset";

/*
  How much looser the caller's address is than the account it is attacking.

  An address is shared — a campus, an office, a phone network all reach the
  internet through one — so it carries every one of its users' mistakes. On the
  account's own budget, one careless afternoon in a computer lab would lock a
  whole building out of the product. It is here to bound a spray across many
  accounts from a single source, which only needs a ceiling, not a tight one.
*/
const ADDRESS_LIMIT_MULTIPLIER = 10;

/** Thrown inside a rotation when a concurrent refresh has already rotated. */
class RotationRaceLost extends Error {}

const sessionEnded = () =>
  new UnauthorizedException({
    code: "INVALID_REFRESH_TOKEN",
    message: "Your session has ended. Sign in again.",
  });

const resetTokenInvalid = () =>
  new GoneException({
    code: "RESET_TOKEN_INVALID",
    message: "This reset link is invalid or has expired. Request a new one.",
  });

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly throttle: RateLimitService,
  ) {}

  async login(
    credentials: { email: string; password: string },
    client: ClientContext,
  ): Promise<AuthSessionResult> {
    const email = normalizeEmail(credentials.email);
    /*
      The account is the key. Behind the web app every request reaches the API
      from one address, so throttling on the caller's address alone would count
      all users against a single budget. A genuinely forwarded client address is
      a second key when there is one — it is spoofable, so it only supplements,
      and it runs on the far looser budget above.
    */
    const keys = this.credentialKeys(email, client);

    // Checked first: a blocked attacker must not cost an Argon2 verification,
    // which is deliberately expensive.
    await this.throttle.assertNotBlocked(LOGIN_SCOPE, keys);

    const account = await this.prisma.user.findUnique({ where: { email } });

    if (!account?.passwordHash) {
      // Spend the same effort as a real check, so timing does not reveal
      // whether the email is registered.
      await this.passwords.verifyAgainstDummy(credentials.password);
      await this.chargeFailure(this.loginRule(), email, client);
      throw invalidCredentials();
    }

    if (!(await this.passwords.verify(account.passwordHash, credentials.password))) {
      await this.chargeFailure(this.loginRule(), email, client);
      throw invalidCredentials();
    }

    /*
      The password was right, so this was never an attack: forget the tally.
      Only the account's — the address's stays, because the next person behind
      it is a different person, and one of them signing in successfully says
      nothing about the attempts around it.
    */
    await this.throttle.clear(LOGIN_SCOPE, [email]);

    // Only revealed once the password is proven, so it cannot be probed.
    if (account.deactivatedAt) {
      throw new UnauthorizedException({
        code: "ACCOUNT_DEACTIVATED",
        message:
          "This account has been deactivated. Contact your institution's administrator.",
      });
    }

    await this.prisma.user.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    return this.startSession(account.id, null, client, account);
  }

  /**
   * Opens a new session family for a user who has just proven who they are —
   * by signing in, or by accepting an invite. `preferredInstitutionId` wins
   * when the user belongs to it; otherwise their most recent membership does.
   */
  async startSession(
    userId: string,
    preferredInstitutionId: string | null,
    client: ClientContext,
    knownAccount?: User,
  ): Promise<AuthSessionResult> {
    const account =
      knownAccount ?? (await this.prisma.user.findUniqueOrThrow({ where: { id: userId } }));
    const memberships = await this.loadMemberships(userId);
    const refreshToken = this.tokens.generateOpaqueToken();

    const session = await this.prisma.authSession.create({
      data: {
        userId,
        familyId: randomUUID(),
        tokenHash: this.tokens.hashToken(refreshToken),
        expiresAt: this.refreshExpiry(),
        activeInstitutionId: chooseInstitution(memberships, preferredInstitutionId),
        userAgent: client.userAgent,
        ipAddress: client.ipAddress,
      },
    });

    return this.buildResult(account, session, refreshToken, memberships);
  }

  /**
   * Rotates a refresh token. The old token is revoked and replaced by a
   * successor derived from it, so concurrent refreshes agree on the same one.
   *
   * A token presented again after it was rotated is a signal it was stolen:
   * within REFRESH_REUSE_GRACE_SECONDS that is ordinary concurrency and the
   * existing successor is handed back; after it, the whole family is revoked.
   */
  async refresh(refreshToken: string, client: ClientContext): Promise<AuthSessionResult> {
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: this.tokens.hashToken(refreshToken) },
    });

    if (!session) {
      throw sessionEnded();
    }

    if (session.revokedAt) {
      return this.resolveRevokedToken(session, refreshToken);
    }

    const now = new Date();

    if (session.expiresAt <= now) {
      throw new UnauthorizedException({
        code: "REFRESH_TOKEN_EXPIRED",
        message: "Your session has expired. Sign in again.",
      });
    }

    const account = await this.prisma.user.findUnique({ where: { id: session.userId } });

    if (!account || account.deactivatedAt) {
      await this.revokeFamily(session.familyId);
      throw new UnauthorizedException({
        code: "ACCOUNT_DEACTIVATED",
        message:
          "This account has been deactivated. Contact your institution's administrator.",
      });
    }

    const memberships = await this.loadMemberships(account.id);
    const successorToken = this.tokens.deriveSuccessorToken(refreshToken);

    let successor: AuthSession;

    try {
      successor = await this.prisma.$transaction(async (tx) => {
        // Conditional on still being live: of two concurrent rotations, only
        // one can revoke the row, and the other takes the grace path below.
        const { count } = await tx.authSession.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { revokedAt: now },
        });

        if (count === 0) {
          throw new RotationRaceLost();
        }

        const created = await tx.authSession.create({
          data: {
            userId: account.id,
            familyId: session.familyId,
            tokenHash: this.tokens.hashToken(successorToken),
            expiresAt: this.refreshExpiry(),
            activeInstitutionId: chooseInstitution(memberships, session.activeInstitutionId),
            userAgent: client.userAgent,
            ipAddress: client.ipAddress,
          },
        });

        await tx.authSession.update({
          where: { id: session.id },
          data: { replacedById: created.id },
        });

        return created;
      });
    } catch (error) {
      if (!(error instanceof RotationRaceLost)) {
        throw error;
      }

      const rotated = await this.prisma.authSession.findUnique({ where: { id: session.id } });

      if (!rotated) {
        throw sessionEnded();
      }

      return this.resolveRevokedToken(rotated, refreshToken);
    }

    return this.buildResult(account, successor, successorToken, memberships);
  }

  /** Ends the whole family, so every token rotated from this one dies too. */
  async logout(refreshToken: string): Promise<void> {
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: this.tokens.hashToken(refreshToken) },
    });

    // Unknown or already-ended tokens succeed quietly: signing out is idempotent.
    if (session) {
      await this.revokeFamily(session.familyId);
    }
  }

  async getSessionContext(user: AuthenticatedUser): Promise<SessionContext> {
    const account = await this.prisma.user.findUnique({ where: { id: user.userId } });

    if (!account || account.deactivatedAt) {
      throw sessionEnded();
    }

    const memberships = await this.loadMemberships(account.id);
    const active = memberships.find((m) => m.institutionId === user.institutionId) ?? null;

    return {
      user: toSessionUser(account),
      activeInstitutionId: active?.institutionId ?? null,
      institutionRole: active?.role ?? null,
      memberships: memberships.map(toMembershipSummary),
    };
  }

  /**
   * Moves the current session to another institution the user belongs to.
   * The session row is updated, so later refreshes stay there; only a new
   * access token is issued — the refresh token is unchanged.
   */
  async switchInstitution(
    user: AuthenticatedUser,
    institutionId: string,
  ): Promise<SwitchedInstitution> {
    const memberships = await this.loadMemberships(user.userId);
    const target = memberships.find((m) => m.institutionId === institutionId);

    if (!target) {
      throw new NotFoundException({
        code: "INSTITUTION_NOT_FOUND",
        message: "Institution not found.",
      });
    }

    const session = await this.prisma.authSession.findUnique({
      where: { id: user.sessionId },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw sessionEnded();
    }

    const account = await this.prisma.user.findUnique({ where: { id: user.userId } });

    if (!account || account.deactivatedAt) {
      throw sessionEnded();
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { activeInstitutionId: institutionId },
    });

    const access = await this.tokens.signAccessToken({
      sub: account.id,
      sid: session.id,
      email: account.email,
      platformRole: account.platformRole,
      institutionId,
      institutionRole: target.role,
    });

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      activeInstitutionId: institutionId,
      institutionRole: target.role,
    };
  }

  /**
   * Emails a reset link when the account exists. Answers the same way either
   * way, and does the issuing after returning, so neither the response nor its
   * timing reveals whether the email is registered.
   */
  async requestPasswordReset(email: string, client: ClientContext): Promise<void> {
    const normalised = normalizeEmail(email);

    /*
      Charged per request rather than per failure: here the request itself is
      the cost — an email in someone's inbox, and a send against the mail
      provider's quota and reputation. Keyed on the submitted address whether
      or not it exists, so the refusal still reveals nothing, and on the caller
      too, so working down a list of emails is not a way round the limit.
    */
    await this.throttle.assertNotBlocked(
      PASSWORD_RESET_SCOPE,
      this.credentialKeys(normalised, client),
    );
    await this.chargeFailure(this.passwordResetRule(), normalised, client);

    const account = await this.prisma.user.findUnique({ where: { email: normalised } });

    if (!account?.passwordHash || account.deactivatedAt) {
      return;
    }

    void this.issuePasswordReset(account).catch((error: unknown) => {
      this.logger.error(
        "Could not issue a password reset",
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const now = new Date();
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.tokens.hashToken(resetToken) },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt <= now || record.user.deactivatedAt) {
      throw resetTokenInvalid();
    }

    const passwordHash = await this.passwords.hash(newPassword);
    /*
      An account made on the server (PlatformAdminsService) has no password
      until its emailed link sets one, through this same flow. Using the link
      proves the address, as accepting an invitation does, and nothing was
      changed, so no "your password was changed" email follows.
    */
    const firstPassword = record.user.passwordHash === null;

    await this.prisma.$transaction(async (tx) => {
      // Consumed conditionally, so the same link redeemed twice at once only
      // changes the password once.
      const { count } = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      });

      if (count === 0) {
        throw resetTokenInvalid();
      }

      await tx.user.update({
        where: { id: record.userId },
        data: firstPassword ? { passwordHash, emailVerifiedAt: now } : { passwordHash },
      });

      // Anyone holding a session — possibly whoever prompted the reset — is out.
      await tx.authSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: record.userId,
          action: firstPassword ? "user.password_set" : "user.password_reset",
          entityType: "User",
          entityId: record.userId,
        },
      });
    });

    if (firstPassword) {
      return;
    }

    await this.mail.sendPasswordChanged({
      to: record.user.email,
      userId: record.userId,
      firstName: record.user.firstName,
      signedOut: "everywhere",
      forgotPasswordUrl: webappLink(
        this.config.getOrThrow<string>("WEBAPP_URL"),
        "forgot-password",
      ),
    });
  }

  private async issuePasswordReset(account: User): Promise<void> {
    const resetToken = this.tokens.generateOpaqueToken();
    const ttlMinutes = this.config.getOrThrow<number>("PASSWORD_RESET_TTL_MINUTES");
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Only the newest link works.
      await tx.passwordResetToken.updateMany({
        where: { userId: account.id, usedAt: null },
        data: { usedAt: now },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: account.id,
          tokenHash: this.tokens.hashToken(resetToken),
          expiresAt: new Date(now.getTime() + ttlMinutes * 60_000),
        },
      });
    });

    await this.mail.sendPasswordReset({
      to: account.email,
      userId: account.id,
      firstName: account.firstName,
      expiresInMinutes: ttlMinutes,
      resetUrl: webappLink(this.config.getOrThrow<string>("WEBAPP_URL"), "reset-password", {
        token: resetToken,
      }),
    });
  }

  /**
   * A token that has already been revoked. If it was rotated moments ago, this
   * is a concurrent request and it gets the successor already issued.
   * Otherwise it is a replay, and the family is ended.
   */
  private async resolveRevokedToken(
    session: AuthSession,
    refreshToken: string,
  ): Promise<AuthSessionResult> {
    // Revoked by sign-out or password reset, never rotated: simply invalid.
    if (!session.replacedById || !session.revokedAt) {
      throw sessionEnded();
    }

    const graceMs = this.config.getOrThrow<number>("REFRESH_REUSE_GRACE_SECONDS") * 1000;
    const withinGrace = Date.now() - session.revokedAt.getTime() <= graceMs;

    if (withinGrace) {
      const successorToken = this.tokens.deriveSuccessorToken(refreshToken);
      const successor = await this.prisma.authSession.findUnique({
        where: { id: session.replacedById },
      });

      const successorIsLive =
        successor &&
        !successor.revokedAt &&
        successor.expiresAt > new Date() &&
        successor.tokenHash === this.tokens.hashToken(successorToken);

      if (successorIsLive) {
        const account = await this.prisma.user.findUnique({ where: { id: session.userId } });

        if (account && !account.deactivatedAt) {
          const memberships = await this.loadMemberships(account.id);
          return this.buildResult(account, successor, successorToken, memberships);
        }
      }
    }

    await this.revokeFamily(session.familyId);
    this.logger.warn(
      `Refresh token reused after rotation; ended session family ${session.familyId}`,
    );

    throw new UnauthorizedException({
      code: "REFRESH_TOKEN_REUSED",
      message: "Your session has ended. Sign in again.",
    });
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Memberships the user can work in: active, at an active institution. */
  private loadMemberships(userId: string): Promise<ActiveMembership[]> {
    return this.prisma.membership.findMany({
      where: {
        userId,
        status: "ACTIVE",
        institution: { status: "ACTIVE", archivedAt: null },
      },
      select: {
        institutionId: true,
        role: true,
        institution: { select: { id: true, name: true, slug: true, kind: true } },
      },
      orderBy: [{ joinedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    });
  }

  private async buildResult(
    account: User,
    session: AuthSession,
    refreshToken: string,
    memberships: ActiveMembership[],
  ): Promise<AuthSessionResult> {
    const active =
      memberships.find((m) => m.institutionId === session.activeInstitutionId) ?? null;

    const access = await this.tokens.signAccessToken({
      sub: account.id,
      sid: session.id,
      email: account.email,
      platformRole: account.platformRole,
      institutionId: active?.institutionId ?? null,
      institutionRole: active?.role ?? null,
    });

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken,
      refreshTokenExpiresAt: session.expiresAt,
      user: toSessionUser(account),
      activeInstitutionId: active?.institutionId ?? null,
      institutionRole: active?.role ?? null,
      memberships: memberships.map(toMembershipSummary),
    };
  }

  /** Both keys a credential attempt is counted against, account first. */
  private credentialKeys(email: string, client: ClientContext): string[] {
    return client.forwardedFor ? [email, client.forwardedFor] : [email];
  }

  /**
   * Charges one attempt to the account, and to the caller's address when one
   * was forwarded — separately, because the two run on different budgets.
   */
  private async chargeFailure(
    rule: RateLimitRule,
    email: string,
    client: ClientContext,
  ): Promise<void> {
    await this.throttle.recordAttempt(rule, [email]);

    if (client.forwardedFor) {
      await this.throttle.recordAttempt(
        { ...rule, limit: rule.limit * ADDRESS_LIMIT_MULTIPLIER },
        [client.forwardedFor],
      );
    }
  }

  private loginRule(): RateLimitRule {
    const windowSeconds = this.config.getOrThrow<number>("LOGIN_THROTTLE_WINDOW_SECONDS");

    return {
      scope: LOGIN_SCOPE,
      limit: this.config.getOrThrow<number>("LOGIN_MAX_FAILURES"),
      windowSeconds,
      // Blocked for as long as the window: long enough to make guessing
      // useless, short enough that a locked-out person is not stuck.
      blockSeconds: windowSeconds,
    };
  }

  private passwordResetRule(): RateLimitRule {
    const windowSeconds = this.config.getOrThrow<number>(
      "PASSWORD_RESET_THROTTLE_WINDOW_SECONDS",
    );

    return {
      scope: PASSWORD_RESET_SCOPE,
      limit: this.config.getOrThrow<number>("PASSWORD_RESET_MAX_REQUESTS"),
      windowSeconds,
      blockSeconds: windowSeconds,
    };
  }

  private refreshExpiry(): Date {
    const days = this.config.getOrThrow<number>("REFRESH_TOKEN_TTL_DAYS");

    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException({
    code: "INVALID_CREDENTIALS",
    message: "The email or password is incorrect.",
  });
}

/** The preferred institution if the user still belongs to it, else the latest. */
function chooseInstitution(
  memberships: ActiveMembership[],
  preferred: string | null,
): string | null {
  if (preferred && memberships.some((m) => m.institutionId === preferred)) {
    return preferred;
  }

  return memberships[0]?.institutionId ?? null;
}

function toSessionUser(account: User): SessionUser {
  return {
    id: account.id,
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    platformRole: account.platformRole,
  };
}

function toMembershipSummary(membership: ActiveMembership): MembershipSummary {
  return {
    institutionId: membership.institutionId,
    institutionName: membership.institution.name,
    institutionSlug: membership.institution.slug,
    role: membership.role,
    independentLearners: membership.institution.kind === "INDEPENDENT_LEARNERS",
  };
}
