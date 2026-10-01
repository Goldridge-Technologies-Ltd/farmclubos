import type { MediaPurpose } from "../../generated/prisma/enums.js";

type MediaRule = {
  /** Accepted types, each with the extension its stored copy is given. */
  types: Record<string, string>;
  maxBytes: number;
  /** For a refusal: what was expected, as a person would say it. */
  expected: string;
};

const MB = 1024 * 1024;

/*
  What each of a video scene's files may be: one MP4 per scene, played as it
  is (nothing is converted), a still image shown before the video loads, and
  WebVTT captions. The production script asks for captions for all
  narration; here they are optional, added when the content team has them.
*/
export const MEDIA_RULES: Record<MediaPurpose, MediaRule> = {
  VIDEO: { types: { "video/mp4": "mp4" }, maxBytes: 1024 * MB, expected: "an MP4 video" },
  CAPTIONS: { types: { "text/vtt": "vtt" }, maxBytes: 1 * MB, expected: "a WebVTT captions file (.vtt)" },
  POSTER: {
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
    maxBytes: 5 * MB,
    expected: "a JPG, PNG or WebP image",
  },
};
