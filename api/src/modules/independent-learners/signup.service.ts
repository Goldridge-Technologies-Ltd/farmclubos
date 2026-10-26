import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ClientContext } from "../../common/auth/client-context.js";
import { normalizeEmail } from "../../common/utils/normalize-email.js";
import { webappLink } from "../../common/utils/webapp-link.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import {
  RateLimitService,
  type RateLimitRule,
} from "../../lib/rate-limit/rate-limit.service.js";
import { ADDRESS_LIMIT_MULTIPLIER } from "../auth/auth.service.js";
import { TokenService } from "../auth/token.service.js";
import { IndependentLearnersService } from "./independent-learners.service.js";

const SIGNUP_SCOPE = "signup";

/*
  Signing up is an invitation people send themselves.

  The form takes only an email address. The account is made — already
  verified — when its owner follows the emailed link and chooses a password,
  on the page an invited person uses (InvitesService.accept), so nothing is
  kept about an address nobody has proven they own beyond the invitation.

  It answers the same way whatever the address, and does the issuing after
  answering, so neither the response nor its timing reveals who has an
  account: an address that already has one is emailed a way to sign in.
*/
@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly throttle: RateLimitService,
    private readonly independent: IndependentLearnersService,
  ) {}

  async signUp(email: string, client: ClientContext): Promise<void> {
    const normalised = normalizeEmail(email);

    /*
      Charged per request, as a password reset is: the cost is an email in
      someone's inbox. Keyed on the submitted address and on the caller, so
      working down a list of addresses is not a way round the limit either.
    */
    await this.throttle.assertNotBlocked(
      SIGNUP_SCOPE,
      client.forwardedFor ? [normalised, client.forwardedFor] : [normalised],
    );
    await this.charge(normalised, client);

    void this.issue(normalised).catch((error: unknown) => {
      this.logger.error(
        "Could not issue a sign-up",
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  private async issue(email: string): Promise<void> {
    const webappUrl = this.config.getOrThrow<string>("WEBAPP_URL");
    const account = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, deactivatedAt: true },
    });

    if (account) {
      // A deactivated account hears nothing: its owner cannot sign in anyway.
      if (!account.deactivatedAt) {
        await this.mail.sendAccountExists({
          to: email,
          userId: account.id,
          firstName: account.firstName,
          signInUrl: webappLink(webappUrl, "sign-in"),
        });
      }

      return;
    }

    const home = await this.independent.home();
    const token = this.tokens.generateOpaqueToken();
    const ttlHours = this.config.getOrThrow<number>("INVITE_TTL_HOURS");
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Only the newest link works, as with any invitation.
      await tx.invite.updateMany({
        where: { institutionId: home.id, email, status: "PENDING" },
        data: { status: "REVOKED", revokedAt: now },
      });

      const invite = await tx.invite.create({
        data: {
          institutionId: home.id,
          email,
          role: "LEARNER",
          tokenHash: this.tokens.hashToken(token),
          expiresAt: new Date(now.getTime() + ttlHours * 3_600_000),
          invitedById: null,
        },
      });

      await tx.auditEvent.create({
        data: {
          institutionId: home.id,
          action: "signup.requested",
          entityType: "Invite",
          entityId: invite.id,
        },
      });
    });

    await this.mail.sendSignup({
      to: email,
      institutionId: home.id,
      expiresInDays: Math.max(1, Math.round(ttlHours / 24)),
      finishUrl: webappLink(webappUrl, "accept-invite", { token }),
    });
  }

  /**
   * One request against the address it names, and against the caller's on
   * the far looser budget an address shared by many people needs
   * (AuthService explains why).
   */
  private async charge(email: string, client: ClientContext): Promise<void> {
    const windowSeconds = this.config.getOrThrow<number>("SIGNUP_THROTTLE_WINDOW_SECONDS");
    const rule: RateLimitRule = {
      scope: SIGNUP_SCOPE,
      limit: this.config.getOrThrow<number>("SIGNUP_MAX_REQUESTS"),
      windowSeconds,
      blockSeconds: windowSeconds,
    };

    await this.throttle.recordAttempt(rule, [email]);

    if (client.forwardedFor) {
      await this.throttle.recordAttempt(
        { ...rule, limit: rule.limit * ADDRESS_LIMIT_MULTIPLIER },
        [client.forwardedFor],
      );
    }
  }
}
