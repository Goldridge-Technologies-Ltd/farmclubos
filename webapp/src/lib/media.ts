import type { MediaPurpose } from "./api/contracts";

const MB = 1024 * 1024;

type MediaRule = {
  /** Accepted extensions and the type each is declared as. */
  types: Record<string, string>;
  maxBytes: number;
  /** For the file picker. */
  accept: string;
};

/*
  What each of a video scene's files may be, checked in the browser for quick
  feedback. The API checks again and is the authority; its rules live in
  api/src/modules/authoring/media-rules.ts, and these must match them.
*/
export const MEDIA_RULES: Record<MediaPurpose, MediaRule> = {
  VIDEO: { types: { mp4: "video/mp4" }, maxBytes: 1024 * MB, accept: "video/mp4,.mp4" },
  CAPTIONS: { types: { vtt: "text/vtt" }, maxBytes: MB, accept: "text/vtt,.vtt" },
  POSTER: {
    types: { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" },
    maxBytes: 5 * MB,
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  },
};

/**
 * The type to declare for a chosen file, or null when the slot does not take
 * it. The browser's own type wins when it is one the slot accepts; when it is
 * missing or unknown — as for most .vtt files — the extension decides.
 */
export function mediaTypeFor(
  purpose: MediaPurpose,
  file: { name: string; type: string },
): string | null {
  const types = MEDIA_RULES[purpose].types;

  if (Object.values(types).includes(file.type)) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  return types[extension] ?? null;
}

/** "1 GB", "4.5 MB", "300 KB". */
export function sizeOf(bytes: number): string {
  const units = [
    ["GB", 1024 ** 3],
    ["MB", MB],
    ["KB", 1024],
  ] as const;

  for (const [unit, size] of units) {
    if (bytes >= size) {
      return `${Math.round((bytes / size) * 10) / 10} ${unit}`;
    }
  }

  return `${bytes} bytes`;
}
