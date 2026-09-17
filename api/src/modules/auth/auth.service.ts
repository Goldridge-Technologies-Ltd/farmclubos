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
import type { InstitutionRole } from "../../generated/prisma/enums.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
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
  institution: { id: string; name: string; slug: string };
};

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
  ) {}

  async login(
    credentials: { email: string; password: string },
    client: ClientContext,
  ): Promise<AuthSessionResult> {
    const account = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(credentials.email) },
    });

    if (!account?.passwordHash) {
      // Spend the same effort as a real check, so timing does not reveal
      // whether the email is registered.
      await this.passwords.verifyAgainstDummy(credentials.password);
      throw invalidCredentials();
    }

    if (!(await this.passwords.verify(account.passwordHash, credentials.password))) {
      throw invalidCredentials();
    }

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
  async requestPasswordReset(email: string): Promise<void> {
    const account = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });

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

      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });

      // Anyone holding a session — possibly whoever prompted the reset — is out.
      await tx.authSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: record.userId,
          action: "user.password_reset",
          entityType: "User",
          entityId: record.userId,
        },
      });
    });

    await this.mail.sendPasswordChanged({
      to: record.user.email,
      userId: record.userId,
      firstName: record.user.firstName,
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
        institution: { select: { id: true, name: true, slug: true } },
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
  };
}
