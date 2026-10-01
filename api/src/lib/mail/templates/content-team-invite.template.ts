import { renderLayout, renderText, type LayoutContent } from "./layout.js";
import type { RenderedEmail } from "./rendered-email.js";

export type ContentTeamInviteEmailInput = {
  inviterName: string;
  acceptUrl: string;
  expiresInDays: number;
};

/**
 * An invitation onto the content team that builds the Academy. It names no
 * institution: the content team works for every one of them.
 */
export function renderContentTeamInvite(input: ContentTeamInviteEmailInput): RenderedEmail {
  const content: LayoutContent = {
    preheader: `${input.inviterName} has invited you to join the FARMCLUB OS content team.`,
    heading: "Join the FARMCLUB OS content team",
    paragraphs: [
      `${input.inviterName} has invited you to join the FARMCLUB OS content team as a content manager.`,
      "The content team builds the Academy: its modules and lessons, with their videos and notes, for every institution's learners.",
    ],
    action: { label: "Accept invitation", url: input.acceptUrl },
    footnotes: [
      `This invitation expires in ${input.expiresInDays} ${input.expiresInDays === 1 ? "day" : "days"} and can be used once.`,
      "If you were not expecting it, you can ignore this email.",
    ],
  };

  return {
    subject: "You're invited to join the FARMCLUB OS content team",
    html: renderLayout(content),
    text: renderText(content),
  };
}
