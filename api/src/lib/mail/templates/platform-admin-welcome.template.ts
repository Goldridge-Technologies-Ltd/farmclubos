import { renderLayout, renderText, type LayoutContent } from "./layout.js";
import type { RenderedEmail } from "./rendered-email.js";

export type PlatformAdminWelcomeEmailInput = {
  firstName: string;
  setPasswordUrl: string;
  expiresInDays: number;
};

/**
 * For a platform administrator's new account, made on the server. It has no
 * password yet, and this link sets the first one.
 */
export function renderPlatformAdminWelcome(input: PlatformAdminWelcomeEmailInput): RenderedEmail {
  const content: LayoutContent = {
    preheader: "Choose a password to sign in to FARMCLUB OS.",
    heading: "Set your FARMCLUB OS password",
    paragraphs: [
      `Hi ${input.firstName},`,
      "A FARMCLUB OS account has been set up for you as a platform administrator: you add institutions and run the content team that builds the Academy.",
      "Choose a password to sign in.",
    ],
    action: { label: "Set your password", url: input.setPasswordUrl },
    footnotes: [
      `This link expires in ${input.expiresInDays} ${input.expiresInDays === 1 ? "day" : "days"} and can be used once.`,
      "If you were not expecting it, you can ignore this email.",
    ],
  };

  return {
    subject: "Set your FARMCLUB OS password",
    html: renderLayout(content),
    text: renderText(content),
  };
}
