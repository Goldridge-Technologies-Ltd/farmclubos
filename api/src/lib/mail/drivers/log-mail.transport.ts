import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { MailTransport, OutgoingMail } from "../mail-transport.js";

/**
 * Writes each email to the server log instead of sending it, so an invite or
 * reset link can be followed in development without an SMTP server. Env
 * validation refuses this driver in production, where it would put those
 * links in the logs.
 */
@Injectable()
export class LogMailTransport implements MailTransport {
  private readonly logger = new Logger("Mail");

  send(mail: OutgoingMail): Promise<{ messageId: string }> {
    this.logger.log(`\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`);

    return Promise.resolve({ messageId: `log-${randomUUID()}` });
  }
}
