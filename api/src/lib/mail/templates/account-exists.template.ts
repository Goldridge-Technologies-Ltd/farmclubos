import { renderLayout, renderText, type LayoutContent } from "./layout.js";
import type { RenderedEmail } from "./rendered-email.js";

export type AccountExistsEmailInput = {
  firstName: string;
  signInUrl: string;
};

/**
 * Sent instead of a sign-up link when the address already has an account, so
 * the sign-up form answers the same whoever asks, and only the owner of the
 * inbox learns that the account exists.
 */
export function renderAccountExists(input: AccountExistsEmailInput): RenderedEmail {
  const content: LayoutContent = {
    preheader: "This email address already has a FARMCLUB OS account.",
    heading: "You already have an account",
    paragraphs: [
      `Hi ${input.firstName},`,
      "Someone asked to sign up to FARMCLUB OS with this email address, which already has an account.",
      "Sign in to carry on. If you have forgotten your password, you can reset it from the sign-in page.",
    ],
    action: { label: "Sign in", url: input.signInUrl },
    footnotes: ["If it was not you, you can ignore this email. Nothing has changed on your account."],
  };

  return {
    subject: "You already have a FARMCLUB OS account",
    html: renderLayout(content),
    text: renderText(content),
  };
}
