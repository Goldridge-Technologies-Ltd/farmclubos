import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { normalizeEmail } from "../../common/utils/normalize-email.js";
import { webappLink } from "../../common/utils/webapp-link.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import { TokenService } from "../auth/token.service.js";
import type { AddedPlatformAdmin, AddPlatformAdminInput } from "./platform-admins.types.js";

type Recipient = { id: string; email: string; firstName: string };

/*
  Makes platform administrators, which the web app never can. A platform
  administrator runs the platform itself, so the role is granted only by
  someone holding the server's environment, through `npm run admin:add`
  (src/cli/add-platform-admin.ts). No HTTP route reaches this service.

  A new account gets no password, only an emailed link to set one: a password
  reset token lasting as long as an invitation, which the web app's reset page
  redeems. So no password is ever typed into, stored on or printed by the
  server. An account that already has a password keeps it.
*/
@Injectable()
export class PlatformAdminsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
  ) {}

  async add(input: AddPlatformAdminInput): Promise<AddedPlatformAdmin> {
    const email = normalizeEmail(input.email);
    const account = await this.prisma.user.findUnique({ where: { email } });

    if (!account) {
      return this.create(email, input);
    }

    const granted = account.platformRole !== "PLATFORM_ADMIN";
    const reactivated = account.deactivatedAt !== null;
    // No password yet: an earlier run's link went unused, or its email failed.
    const token = account.passwordHash === null ? this.tokens.generateOpaqueToken() : null;
    const outcome = { email, created: false, granted, reactivated, passwordLink: null };

    if (!granted && !reactivated && !token) {
      return outcome;
    }

    await this.prisma.$transaction(async (tx) => {
      if (granted || reactivated) {
        await tx.user.update({
          where: { id: account.id },
          data: { platformRole: "PLATFORM_ADMIN", deactivatedAt: null },
        });
        await this.audit(tx, account.id, {
          via: "command",
          previousRole: account.platformRole,
          reactivated,
        });
      }

      if (token) {
        await this.storeLink(tx, account.id, token);
      }
    });

    return token ? { ...outcome, passwordLink: await this.sendLink(account, token) } : outcome;
  }

  private async create(email: string, input: AddPlatformAdminInput): Promise<AddedPlatformAdmin> {
    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();

    if (!firstName || !lastName) {
      throw new BadRequestException({
        code: "NAMES_REQUIRED",
        message: `There is no account for ${email} yet, and a new one needs a first and last name.`,
      });
    }

    const token = this.tokens.generateOpaqueToken();

    const account = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, firstName, lastName, platformRole: "PLATFORM_ADMIN" },
      });

      await this.audit(tx, created.id, { via: "command", created: true });
      await this.storeLink(tx, created.id, token);

      return created;
    });

    return {
      email,
      created: true,
      granted: true,
      reactivated: false,
      passwordLink: await this.sendLink(account, token),
    };
  }

  /** Only the newest link works, as with a password reset. */
  private async storeLink(tx: Prisma.TransactionClient, userId: string, token: string): Promise<void> {
    const now = new Date();

    await tx.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    });
    await tx.passwordResetToken.create({
      data: {
        userId,
        tokenHash: this.tokens.hashToken(token),
        expiresAt: new Date(now.getTime() + this.ttlHours() * 3_600_000),
      },
    });
  }

  /** Sent after the transaction, so a failed email never undoes the account. */
  private async sendLink(
    account: Recipient,
    token: string,
  ): Promise<NonNullable<AddedPlatformAdmin["passwordLink"]>> {
    const expiresInDays = Math.max(1, Math.round(this.ttlHours() / 24));
    const emailStatus = await this.mail.sendPlatformAdminWelcome({
      to: account.email,
      userId: account.id,
      firstName: account.firstName,
      expiresInDays,
      setPasswordUrl: webappLink(this.config.getOrThrow<string>("WEBAPP_URL"), "reset-password", {
        token,
      }),
    });

    return { emailStatus, expiresInDays };
  }

  /** Done on the server, by nobody signed in, so the event has no actor. */
  private audit(
    tx: Prisma.TransactionClient,
    userId: string,
    metadata: Prisma.InputJsonObject,
  ): Promise<unknown> {
    return tx.auditEvent.create({
      data: {
        actorUserId: null,
        action: "user.platform_admin_granted",
        entityType: "User",
        entityId: userId,
        metadata,
      },
    });
  }

  /** The link stands in for an invitation, so it lasts as long as one. */
  private ttlHours(): number {
    return this.config.getOrThrow<number>("INVITE_TTL_HOURS");
  }
}
