import { escapeHtml } from "./escape-html.js";
import { renderInvite } from "./invite.template.js";
import { renderPasswordChanged } from "./password-changed.template.js";
import { renderPasswordReset } from "./password-reset.template.js";

describe("escapeHtml", () => {
  it("neutralises every character that can open markup or an attribute", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;",
    );
  });
});

describe("renderInvite", () => {
  const base = {
    institutionName: "Greenfield Technical College",
    inviterName: "Ada Obi",
    role: "LEARNER" as const,
    acceptUrl: "http://localhost:3001/accept-invite?token=abc123",
    expiresInDays: 7,
  };

  it("names the institution and the role in the subject and body", () => {
    const email = renderInvite(base);

    expect(email.subject).toBe(
      "You're invited to join Greenfield Technical College on FARMCLUB OS",
    );
    expect(email.text).toContain(
      "Ada Obi has invited you to join Greenfield Technical College as a learner.",
    );
  });

  it("uses the right article for a role that starts with a vowel", () => {
    const email = renderInvite({ ...base, role: "INSTITUTION_ADMIN" });

    expect(email.text).toContain("as an institution administrator.");
  });

  it("carries the accept link in both the HTML and the plain-text part", () => {
    const email = renderInvite(base);

    expect(email.html).toContain('href="http://localhost:3001/accept-invite?token=abc123"');
    expect(email.text).toContain("http://localhost:3001/accept-invite?token=abc123");
  });

  it("escapes names in the HTML so a hostile institution name cannot inject markup", () => {
    const email = renderInvite({
      ...base,
      institutionName: '<img src=x onerror="steal()">',
    });

    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;img src=x onerror=&quot;steal()&quot;&gt;");
  });

  it("states when the invitation expires", () => {
    expect(renderInvite(base).text).toContain("expires in 7 days");
  });

  it("says 'day', not 'days', for a one-day invitation", () => {
    expect(renderInvite({ ...base, expiresInDays: 1 }).text).toContain("expires in 1 day ");
  });
});

describe("renderPasswordReset", () => {
  it("carries the reset link and its lifetime", () => {
    const email = renderPasswordReset({
      firstName: "Tunde",
      resetUrl: "http://localhost:3001/reset-password?token=xyz",
      expiresInMinutes: 60,
    });

    expect(email.subject).toBe("Reset your FARMCLUB OS password");
    expect(email.text).toContain("Hi Tunde,");
    expect(email.html).toContain('href="http://localhost:3001/reset-password?token=xyz"');
    expect(email.text).toContain("expires in 60 minutes");
  });
});

describe("renderPasswordChanged", () => {
  it("tells the person what happened and where to go if it was not them", () => {
    const email = renderPasswordChanged({
      firstName: "Tunde",
      forgotPasswordUrl: "http://localhost:3001/forgot-password",
    });

    expect(email.subject).toBe("Your FARMCLUB OS password was changed");
    expect(email.text).toContain("signed out on every device");
    expect(email.html).toContain('href="http://localhost:3001/forgot-password"');
  });
});
