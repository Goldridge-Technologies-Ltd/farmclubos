import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import type { MailTransport, OutgoingMail } from "../mail-transport.js";

/** How long ZeptoMail has to answer before the email counts as failed. */
const TIMEOUT_MS = 15_000;

/** The scheme ZeptoMail's Authorization header names its key with. */
const KEY_SCHEME = "Zoho-enczapikey";

/** The parts of ZeptoMail's reply worth reading. Both error shapes are in use. */
type ZeptoMailReply = {
  request_id?: string;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ code?: string; message?: string }>;
  };
  data?: { error_code?: string; message?: string } | unknown[];
};

/**
 * Sends through ZeptoMail's HTTP API — ZeptoMail is now Zoho CPaaS — for
 * hosts that block outbound SMTP, as Render's free instances do: one POST per
 * email to the account's data centre (ZEPTOMAIL_API_HOST), authorised with a
 * Mail Agent's Send Mail token. MAIL_FROM must be on a domain that agent has
 * verified.
 *
 * Tracking is off on every email: click tracking would send each single-use
 * invitation and reset link through a redirect of Zoho's.
 *
 * A refusal throws with ZeptoMail's own reason and codes, which MailService
 * records against the email. The key never appears in it.
 */
@Injectable()
export class ZeptoMailTransport implements MailTransport {
  constructor(private readonly config: ConfigService) {}

  async send(mail: OutgoingMail): Promise<{ messageId: string }> {
    let response: Response;

    try {
      response = await fetch(
        `https://${this.config.getOrThrow<string>("ZEPTOMAIL_API_HOST")}/v1.1/email`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: this.authorization(),
          },
          body: JSON.stringify({
            from: sender(mail.from),
            to: [{ email_address: { address: mail.to } }],
            subject: mail.subject,
            htmlbody: mail.html,
            textbody: mail.text,
            track_clicks: false,
            track_opens: false,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
    } catch (error) {
      throw new Error(
        `ZeptoMail could not be reached: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }

    const reply = await readReply(response);

    if (!response.ok) {
      throw new Error(`ZeptoMail refused the email (HTTP ${response.status})${reasonIn(reply)}`);
    }

    return { messageId: reply?.request_id ?? `zeptomail-${randomUUID()}` };
  }

  /** The key is shown with its scheme in ZeptoMail; either way works here. */
  private authorization(): string {
    const key = this.config
      .getOrThrow<string>("ZEPTOMAIL_API_KEY")
      .trim()
      .replace(new RegExp(`^${KEY_SCHEME}\\s+`, "i"), "");

    return `${KEY_SCHEME} ${key}`;
  }
}

/** `FARMCLUB OS <no-reply@farmclubos.com>`, or a bare address, as ZeptoMail's `from`. */
function sender(from: string): { address: string; name?: string } {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);

  if (!match) {
    return { address: from.trim() };
  }

  const name = match[1].replace(/^"(.*)"$/, "$1").trim();
  const address = match[2].trim();

  return name ? { address, name } : { address };
}

/** The reply's JSON, or null when it has none, as a gateway's error page does not. */
async function readReply(response: Response): Promise<ZeptoMailReply | null> {
  try {
    return (await response.json()) as ZeptoMailReply;
  } catch {
    return null;
  }
}

/** ZeptoMail's own words for a refusal, each with its code, or nothing. */
function reasonIn(reply: ZeptoMailReply | null): string {
  const parts: string[] = [];

  if (reply?.error) {
    parts.push(withCode(reply.error.message, reply.error.code));

    for (const detail of reply.error.details ?? []) {
      parts.push(withCode(detail.message, detail.code));
    }
  } else if (reply?.data && !Array.isArray(reply.data)) {
    parts.push(withCode(reply.data.message, reply.data.error_code));
  }

  const said = parts.filter(Boolean);

  return said.length > 0 ? `: ${said.join(": ")}` : "";
}

function withCode(message: string | undefined, code: string | undefined): string {
  if (!message) {
    return code ?? "";
  }

  return code ? `${message} (${code})` : message;
}
