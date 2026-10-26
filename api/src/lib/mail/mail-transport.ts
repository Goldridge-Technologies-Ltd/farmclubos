/** What a transport is given to send. */
export type OutgoingMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * A way of delivering mail. The implementation is chosen once, at boot, from
 * MAIL_DRIVER: `log` in development; `smtp`, or `zeptomail` where outbound
 * SMTP is blocked, everywhere else.
 */
export interface MailTransport {
  send(mail: OutgoingMail): Promise<{ messageId: string }>;
}

export const MAIL_TRANSPORT = Symbol("MAIL_TRANSPORT");
