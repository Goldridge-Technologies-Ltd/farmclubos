import type { InstitutionRole } from "../../../generated/prisma/enums.js";
import { renderLayout, renderText, type LayoutContent } from "./layout.js";
import type { RenderedEmail } from "./rendered-email.js";

/** How each role reads in a sentence, with its article. */
const ROLE_PHRASE: Record<InstitutionRole, string> = {
  INSTITUTION_ADMIN: "an institution administrator",
  FACILITATOR: "a facilitator",
  MENTOR: "a mentor",
  LEARNER: "a learner",
};

export type InviteEmailInput = {
  institutionName: string;
  inviterName: string;
  role: InstitutionRole;
  acceptUrl: string;
  expiresInDays: number;
};

export function renderInvite(input: InviteEmailInput): RenderedEmail {
  const content: LayoutContent = {
    preheader: `${input.inviterName} has invited you to join ${input.institutionName}.`,
    heading: `Join ${input.institutionName} on FARMCLUB OS`,
    paragraphs: [
      `${input.inviterName} has invited you to join ${input.institutionName} as ${ROLE_PHRASE[input.role]}.`,
      "FARMCLUB OS brings structured learning, practical experience and enterprise development together in one place.",
    ],
    action: { label: "Accept invitation", url: input.acceptUrl },
    footnotes: [
      `This invitation expires in ${input.expiresInDays} days and can be used once.`,
      "If you were not expecting it, you can ignore this email.",
    ],
  };

  return {
    subject: `You're invited to join ${input.institutionName} on FARMCLUB OS`,
    html: renderLayout(content),
    text: renderText(content),
  };
}
