import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service.js";
import { MAIL_TRANSPORT, type MailTransport } from "./mail-transport.js";
import {
  renderContentTeamInvite,
  type ContentTeamInviteEmailInput,
} from "./templates/content-team-invite.template.js";
import { renderInvite, type InviteEmailInput } from "./templates/invite.template.js";
import {
  renderPasswordChanged,
  type PasswordChangedEmailInput,
} from "./templates/password-changed.template.js";
import {
  renderPasswordReset,
  type PasswordResetEmailInput,
} from "./templates/password-reset.template.js";
import type { RenderedEmail } from "./templates/rendered-email.js";

export type EmailDeliveryStatus = "SENT" | "FAILED";

type Delivery = {
  to: string;
  template: string;
  content: RenderedEmail;
  institutionId?: string;
  userId?: string;
};

/**
 * Renders and sends the API's transactional email, and keeps an EmailMessage
 * row for each one so a failed delivery can be diagnosed.
 *
 * Sending never throws: a failed email is recorded and reported back as
 * FAILED, so the work that triggered it — an invite, a password reset — is not
 * rolled back because an SMTP server was unreachable.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
  ) {}

  sendInvite(
    input: InviteEmailInput & { to: string; institutionId: string },
  ): Promise<EmailDeliveryStatus> {
    return this.deliver({
      to: input.to,
      template: "invite",
      content: renderInvite(input),
      institutionId: input.institutionId,
    });
  }

  sendContentTeamInvite(
    input: ContentTeamInviteEmailInput & { to: string },
  ): Promise<EmailDeliveryStatus> {
    return this.deliver({
      to: input.to,
      template: "content-team-invite",
      content: renderContentTeamInvite(input),
    });
  }

  sendPasswordReset(
    input: PasswordResetEmailInput & { to: string; userId: string },
  ): Promise<EmailDeliveryStatus> {
    return this.deliver({
      to: input.to,
      template: "password-reset",
      content: renderPasswordReset(input),
      userId: input.userId,
    });
  }

  sendPasswordChanged(
    input: PasswordChangedEmailInput & { to: string; userId: string },
  ): Promise<EmailDeliveryStatus> {
    return this.deliver({
      to: input.to,
      template: "password-changed",
      content: renderPasswordChanged(input),
      userId: input.userId,
    });
  }

  private async deliver(delivery: Delivery): Promise<EmailDeliveryStatus> {
    const record = await this.prisma.emailMessage.create({
      data: {
        to: delivery.to,
        subject: delivery.content.subject,
        template: delivery.template,
        status: "QUEUED",
        institutionId: delivery.institutionId,
        userId: delivery.userId,
      },
    });

    try {
      const { messageId } = await this.transport.send({
        from: this.config.getOrThrow<string>("MAIL_FROM"),
        to: delivery.to,
        ...delivery.content,
      });

      await this.prisma.emailMessage.update({
        where: { id: record.id },
        data: { status: "SENT", providerMessageId: messageId, sentAt: new Date() },
      });

      return "SENT";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`Could not send "${delivery.template}" email`, message);

      await this.prisma.emailMessage.update({
        where: { id: record.id },
        data: { status: "FAILED", error: message.slice(0, 1000) },
      });

      return "FAILED";
    }
  }
}
