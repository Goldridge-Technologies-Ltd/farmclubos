import { parseArgs } from "node:util";
import { isEmail } from "class-validator";
import type {
  AddedPlatformAdmin,
  AddPlatformAdminInput,
} from "../modules/platform-admins/platform-admins.types.js";

/*
  What `npm run admin:add` reads from its arguments and prints back, kept
  apart from the entry point (add-platform-admin.ts) so it can be tested
  without starting the application.
*/

export const USAGE = `Makes someone a FARMCLUB OS platform administrator. Run it where the API
runs, with its environment:

  npm run admin:add --workspace api -- --email <address> [--first-name <name> --last-name <name>]

An existing account becomes a platform administrator and keeps its password.
A new account needs --first-name and --last-name, and gets no password: it is
emailed a link to set one, so no password is typed or stored here.`;

/** The length the API accepts for a name everywhere else (AcceptInviteDto). */
const NAME_MAX_LENGTH = 80;

export type Command =
  | { kind: "add"; input: AddPlatformAdminInput }
  | { kind: "help" }
  | { kind: "error"; message: string };

export function readOptions(args: string[]): Command {
  if (args.some((arg) => arg === "--password" || arg.startsWith("--password="))) {
    return {
      kind: "error",
      message: "There is no --password: a new account is emailed a link to set its own.",
    };
  }

  let values: Record<string, string | boolean | undefined>;

  try {
    ({ values } = parseArgs({
      args,
      strict: true,
      allowPositionals: false,
      options: {
        email: { type: "string" },
        "first-name": { type: "string" },
        "last-name": { type: "string" },
        help: { type: "boolean", short: "h" },
      },
    }));
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }

  if (values.help) {
    return { kind: "help" };
  }

  const email = text(values.email);
  const firstName = text(values["first-name"]);
  const lastName = text(values["last-name"]);

  if (!email) {
    return { kind: "error", message: "Give the person's address with --email." };
  }

  if (!isEmail(email)) {
    return { kind: "error", message: `"${email}" is not an email address.` };
  }

  if (!firstName && !lastName) {
    return { kind: "add", input: { email } };
  }

  if (!firstName || !lastName) {
    return {
      kind: "error",
      message: "A new account needs both --first-name and --last-name.",
    };
  }

  if (firstName.length > NAME_MAX_LENGTH || lastName.length > NAME_MAX_LENGTH) {
    return { kind: "error", message: `A name can be at most ${NAME_MAX_LENGTH} characters.` };
  }

  return { kind: "add", input: { email, firstName, lastName } };
}

/** What happened, in sentences for whoever ran the command. */
export function report(result: AddedPlatformAdmin): string {
  const { email, passwordLink } = result;
  const expiry = passwordLink
    ? `It works once and expires in ${passwordLink.expiresInDays} ${passwordLink.expiresInDays === 1 ? "day" : "days"}.`
    : "";

  if (result.created) {
    return passwordLink?.emailStatus === "SENT"
      ? `Made a new account for ${email} as a platform administrator. They have been emailed a link to set their password. ${expiry}`
      : `Made a new account for ${email} as a platform administrator, but the email with the link to set its password did not send. Check the SMTP settings, then run this again to send a fresh link.`;
  }

  const sentences = [
    result.granted
      ? `${email} is now a platform administrator.`
      : `${email} is already a platform administrator.`,
  ];

  if (result.reactivated) {
    sentences.push("The account was deactivated, and is active again.");
  }

  if (!passwordLink) {
    sentences.push(
      result.granted || result.reactivated ? "Its password is unchanged." : "Nothing changed.",
    );
  } else if (passwordLink.emailStatus === "SENT") {
    sentences.push(
      `It has no password yet, so it has been emailed a fresh link to set one, and any earlier link no longer works. ${expiry}`,
    );
  } else {
    sentences.push(
      "It has no password yet, but the email with a fresh link to set one did not send. Check the SMTP settings, then run this again.",
    );
  }

  return sentences.join(" ");
}

function text(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}
