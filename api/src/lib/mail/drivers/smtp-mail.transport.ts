import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";
import type { MailTransport, OutgoingMail } from "../mail-transport.js";

/**
 * Sends through any SMTP provider (Resend, Postmark, SES, Mailpit locally).
 * The connection is created on first use rather than at construction, so this
 * provider can be registered while MAIL_DRIVER is `log` and no SMTP_HOST is
 * set.
 */
@Injectable()
export class SmtpMailTransport implements MailTransport {
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  async send(mail: OutgoingMail): Promise<{ messageId: string }> {
    const info = (await this.connection().sendMail(mail)) as { messageId: string };

    return { messageId: info.messageId };
  }

  private connection(): Transporter {
    if (!this.transporter) {
      const user = this.config.get<string>("SMTP_USER");

      this.transporter = nodemailer.createTransport({
        host: this.config.getOrThrow<string>("SMTP_HOST"),
        port: this.config.getOrThrow<number>("SMTP_PORT"),
        secure: this.config.getOrThrow<boolean>("SMTP_SECURE"),
        auth: user
          ? { user, pass: this.config.get<string>("SMTP_PASSWORD") }
          : undefined,
      });
    }

    return this.transporter;
  }
}
