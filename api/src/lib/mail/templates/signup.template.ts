import { renderLayout, renderText, type LayoutContent } from "./layout.js";
import type { RenderedEmail } from "./rendered-email.js";

export type SignupEmailInput = {
  finishUrl: string;
  expiresInDays: number;
};

/**
 * For someone who signed up on their own. The account is made only when they
 * follow the link and choose a password, so the address is proven first.
 */
export function renderSignup(input: SignupEmailInput): RenderedEmail {
  const content: LayoutContent = {
    preheader: "Choose a password to start learning on FARMCLUB OS.",
    heading: "Finish creating your account",
    paragraphs: [
      "Thank you for signing up to FARMCLUB OS.",
      "Follow the link to add your name and choose a password. You can then start any pathway in the Academy and learn at your own pace.",
    ],
    action: { label: "Finish creating your account", url: input.finishUrl },
    footnotes: [
      `This link expires in ${input.expiresInDays} ${input.expiresInDays === 1 ? "day" : "days"} and can be used once.`,
      "If you did not sign up, you can ignore this email: no account is made unless the link is used.",
    ],
  };

  return {
    subject: "Finish creating your FARMCLUB OS account",
    html: renderLayout(content),
    text: renderText(content),
  };
}
