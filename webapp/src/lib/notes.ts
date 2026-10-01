/*
  Lesson notes: the small formatting syntax the content team writes in, read
  into blocks the lesson page renders with the design system's type.

    ## Heading           ### Smaller heading
    **bold**             _italic_ (or *italic*)
    - item  * item       1. item  2) item
    [text](https://…)    \* for a literal marker

  Deliberately small, and never HTML: what comes out is a tree of text,
  emphasis, lists and links that React renders as elements, so nothing typed
  here can become markup. A link is made only of a web or email address.
*/

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

/**
 * Headings start at level 3: on the lesson page the lesson is the h1 and each
 * scene an h2, so a heading in the notes sits beneath both.
 */
export type Block =
  | { type: "heading"; level: 3 | 4; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] };

const HEADING = /^(#{1,6})\s+(.+)$/;
const BULLET = /^[-*+]\s+(.+)$/;
const NUMBERED = /^\d+[.)]\s+(.+)$/;
const SAFE_HREF = /^(?:https?:\/\/|mailto:)\S+$/i;
const ESCAPABLE = /[\\*_[\]()#+\-.!`]/;

export function parseNotes(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const endParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };

  const endList = () => {
    if (list) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items.map(parseInline) });
      list = null;
    }
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();

    if (!line) {
      endParagraph();
      endList();
      continue;
    }

    const heading = HEADING.exec(line);

    if (heading) {
      endParagraph();
      endList();
      blocks.push({
        type: "heading",
        level: heading[1].length >= 3 ? 4 : 3,
        children: parseInline(heading[2].trim()),
      });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;

    if (item) {
      endParagraph();

      const ordered = numbered !== null;

      if (list && list.ordered !== ordered) {
        endList();
      }

      list ??= { ordered, items: [] };
      list.items.push(item[1]);
      continue;
    }

    endList();
    paragraph.push(line);
  }

  endParagraph();
  endList();

  return blocks;
}

/** Emphasis, strong emphasis and links within one block of text. */
function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) {
      out.push({ type: "text", text: buffer });
      buffer = "";
    }
  };

  while (i < text.length) {
    const character = text[i];

    if (character === "\\" && i + 1 < text.length && ESCAPABLE.test(text[i + 1])) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    if (text.startsWith("**", i) && opens(text, i, 2)) {
      const close = closing(text, "**", i + 2);

      if (close !== -1) {
        flush();
        out.push({ type: "strong", children: parseInline(text.slice(i + 2, close)) });
        i = close + 2;
        continue;
      }
    }

    if ((character === "_" || character === "*") && !text.startsWith("**", i) && opens(text, i, 1)) {
      const close = closing(text, character, i + 1);

      if (close !== -1) {
        flush();
        out.push({ type: "em", children: parseInline(text.slice(i + 1, close)) });
        i = close + 1;
        continue;
      }
    }

    if (character === "[") {
      const link = linkAt(text, i);

      if (link) {
        flush();
        out.push({ type: "link", href: link.href, children: parseInline(link.label) });
        i = link.end;
        continue;
      }
    }

    buffer += character;
    i += 1;
  }

  flush();

  return out;
}

/**
 * Whether a marker at `at` can open emphasis: not in the middle of a word —
 * so crop_plan_v2 stays as typed — and followed by something, not a space.
 */
function opens(text: string, at: number, length: number): boolean {
  const before = at === 0 ? " " : text[at - 1];
  const after = text[at + length];

  return after !== undefined && !/\s/.test(after) && !/[A-Za-z0-9]/.test(before);
}

/** Where a marker closes: after a non-space, and not in the middle of a word. */
function closing(text: string, marker: string, from: number): number {
  for (let at = text.indexOf(marker, from); at !== -1; at = text.indexOf(marker, at + 1)) {
    const before = text[at - 1];
    const after = text[at + marker.length];

    if (at > from && !/\s/.test(before) && (after === undefined || !/[A-Za-z0-9]/.test(after))) {
      // A single * must not be the first half of a **.
      if (marker === "*" && after === "*") {
        continue;
      }

      return at;
    }
  }

  return -1;
}

/** `[label](href)` at `at`, when the address is one a link may go to. */
function linkAt(text: string, at: number): { label: string; href: string; end: number } | null {
  const labelEnd = text.indexOf("](", at + 1);

  if (labelEnd === -1) {
    return null;
  }

  const hrefEnd = text.indexOf(")", labelEnd + 2);

  if (hrefEnd === -1) {
    return null;
  }

  const label = text.slice(at + 1, labelEnd);
  const href = text.slice(labelEnd + 2, hrefEnd).trim();

  if (!label.trim() || !SAFE_HREF.test(href)) {
    return null;
  }

  return { label, href, end: hrefEnd + 1 };
}
