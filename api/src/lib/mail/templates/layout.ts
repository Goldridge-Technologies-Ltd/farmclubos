import { escapeHtml } from "./escape-html.js";

/*
  The shared email shell.

  Email clients ignore stylesheets and CSS variables, so this is the one place
  in the API where colour values are written out: each is copied from the
  token named beside it in packages/design-system/styles/theme.css. Change the
  token there first, then here.

  The brand appears as a text wordmark rather than the logo file: the logo is
  SVG, which Gmail and Outlook do not render, and no PNG is provided.
*/
const COLOUR = {
  green950: "#052a19", // --color-farm-green-950: headings
  green800: "#0a4a2d", // --color-farm-green-800: primary button
  charcoal: "#14231c", // --color-farm-charcoal: body text
  muted: "#5d6b64", // --color-farm-muted: supporting text
  border: "#e2e8e3", // --color-farm-border: hairlines
  cream50: "#f9f9f7", // --color-farm-cream-50: page background
  white: "#ffffff",
} as const;

const FONT = "Inter, 'Segoe UI', Arial, sans-serif";

export type LayoutContent = {
  /** Shown in the inbox list beside the subject; plain text. */
  preheader: string;
  heading: string;
  /** Paragraphs of plain text; each is escaped. */
  paragraphs: string[];
  action: { label: string; url: string };
  /** Smaller closing lines under the button; plain text. */
  footnotes: string[];
};

export function renderLayout(content: LayoutContent): string {
  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:26px;color:${COLOUR.charcoal};">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

  const footnotes = content.footnotes
    .map(
      (footnote) =>
        `<p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:22px;color:${COLOUR.muted};">${escapeHtml(footnote)}</p>`,
    )
    .join("");

  const url = escapeHtml(content.action.url);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(content.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOUR.cream50};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOUR.cream50};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLOUR.white};border:1px solid ${COLOUR.border};border-radius:12px;">
<tr><td style="padding:32px 32px 0;">
<p style="margin:0 0 28px;font-family:${FONT};font-size:14px;font-weight:700;letter-spacing:0.12em;color:${COLOUR.green950};">FARMCLUB OS</p>
<h1 style="margin:0 0 20px;font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${COLOUR.green950};">${escapeHtml(content.heading)}</h1>
${paragraphs}
</td></tr>
<tr><td style="padding:8px 32px 24px;">
<a href="${url}" style="display:inline-block;padding:14px 24px;background:${COLOUR.green800};border-radius:8px;font-family:${FONT};font-size:15px;font-weight:600;color:${COLOUR.white};text-decoration:none;">${escapeHtml(content.action.label)}</a>
</td></tr>
<tr><td style="padding:0 32px 32px;border-top:1px solid ${COLOUR.border};">
<p style="margin:24px 0 12px;font-family:${FONT};font-size:13px;line-height:22px;color:${COLOUR.muted};">If the button does not work, copy this link into your browser:<br><a href="${url}" style="color:${COLOUR.green800};word-break:break-all;">${url}</a></p>
${footnotes}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** The plain-text part: the same content, readable in any client. */
export function renderText(content: LayoutContent): string {
  return [
    content.heading,
    "",
    ...content.paragraphs.flatMap((paragraph) => [paragraph, ""]),
    `${content.action.label}: ${content.action.url}`,
    "",
    ...content.footnotes,
    "",
    "— FARMCLUB OS",
  ].join("\n");
}
