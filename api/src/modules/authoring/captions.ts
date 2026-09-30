/** A gap in the narration at least this long starts a new paragraph. */
const PARAGRAPH_PAUSE_SECONDS = 2;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&lrm;": "",
  "&rlm;": "",
};

/**
 * The words a WebVTT captions file speaks, as a transcript: cue text only —
 * no timings, cue numbers or styling — with a new paragraph wherever the
 * narration pauses. Null when the file is not WebVTT, or has no cues.
 *
 * Learners get the transcript from the same file as the captions, so the two
 * cannot drift apart.
 */
export function transcriptFromVtt(source: string): string | null {
  const text = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  if (!/^WEBVTT(?:[ \t].*)?(?:\n|$)/.test(text)) {
    return null;
  }

  const paragraphs: string[][] = [];
  let previousEnd: number | null = null;

  // The header block is the first; every other block is a cue, a NOTE, a
  // STYLE or a REGION.
  for (const block of text.split(/\n{2,}/).slice(1)) {
    const lines = block.split("\n");
    const timing = lines.findIndex((line) => line.includes("-->"));

    if (timing === -1) {
      continue;
    }

    const [start, end] = lines[timing].split("-->").map((part) => seconds(part.trim().split(/\s+/)[0]));
    const words = lines
      .slice(timing + 1)
      .map(clean)
      .filter(Boolean)
      .join(" ");

    if (!words) {
      continue;
    }

    const pause = previousEnd !== null && start - previousEnd >= PARAGRAPH_PAUSE_SECONDS;

    if (paragraphs.length === 0 || pause) {
      paragraphs.push([]);
    }

    paragraphs[paragraphs.length - 1].push(words);
    previousEnd = end;
  }

  return paragraphs.length === 0 ? null : paragraphs.map((cues) => cues.join(" ")).join("\n\n");
}

/** "00:01:02.500" or "01:02.500" as seconds. */
function seconds(timestamp: string): number {
  return timestamp
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
}

/** A cue line without its tags, entities decoded, whitespace settled. */
function clean(line: string): string {
  return line
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|nbsp|lrm|rlm);/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, " ")
    .trim();
}
