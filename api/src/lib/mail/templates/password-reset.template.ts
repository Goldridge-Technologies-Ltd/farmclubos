import { renderLayout, renderText, type LayoutContent } from "./layout.js";
import type { RenderedEmail } from "./rendered-email.js";

export type PasswordResetEmailInput = {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export function renderPasswordReset(input: PasswordResetEmailInput): RenderedEmail {
  const content: LayoutContent = {
    preheader: "Use this link to choose a new password.",
    heading: "Reset your password",
    paragraphs: [
      `Hi ${input.firstName},`,
      "We received a request to reset the password for your FARMCLUB OS account.",
    ],
    action: { label: "Reset password", url: input.resetUrl },
    footnotes: [
      `This link expires in ${input.expiresInMinutes} minutes and can be used once.`,
      "If you did not ask for this, you can ignore this email. Your password will not change.",
    ],
  };

  return {
    subject: "Reset your FARMCLUB OS password",
    html: renderLayout(content),
    text: renderText(content),
  };
}
