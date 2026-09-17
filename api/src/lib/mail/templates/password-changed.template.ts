import { renderLayout, renderText, type LayoutContent } from "./layout.js";
import type { RenderedEmail } from "./rendered-email.js";

export type PasswordChangedEmailInput = {
  firstName: string;
  forgotPasswordUrl: string;
};

export function renderPasswordChanged(
  input: PasswordChangedEmailInput,
): RenderedEmail {
  const content: LayoutContent = {
    preheader: "Your password was changed.",
    heading: "Your password was changed",
    paragraphs: [
      `Hi ${input.firstName},`,
      "The password for your FARMCLUB OS account was just changed, and you have been signed out on every device.",
    ],
    action: { label: "Reset your password", url: input.forgotPasswordUrl },
    footnotes: [
      "If you made this change, there is nothing more to do.",
      "If you did not, reset your password straight away and tell your institution's administrator.",
    ],
  };

  return {
    subject: "Your FARMCLUB OS password was changed",
    html: renderLayout(content),
    text: renderText(content),
  };
}
