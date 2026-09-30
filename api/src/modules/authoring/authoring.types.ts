import type {
  AuthoringStatus,
  LessonKind,
  LessonSceneKind,
  MediaPurpose,
  PublishStatus,
} from "../../generated/prisma/enums.js";
import type { SceneGap } from "../academy/scene-readiness.js";

/*
  What the content team's screens are given. Unlike the learner's catalogue,
  every view here shows drafts and archived items too, with their status.
*/

export type AuthoringPathwaySummaryView = {
  id: string;
  slug: string;
  title: string;
  status: PublishStatus;
  /** Real counts of modules not archived, and of those published. */
  moduleCount: number;
  publishedModuleCount: number;
};

export type AuthoringModuleSummaryView = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  sequence: number;
  status: PublishStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
  lessonCount: number;
  publishedLessonCount: number;
};

export type AuthoringPathwayView = AuthoringPathwaySummaryView & {
  summary: string;
  modules: AuthoringModuleSummaryView[];
};

export type AuthoringLessonSummaryView = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  sequence: number;
  status: PublishStatus;
  publishedAt: Date | null;
  archivedAt: Date | null;
  kind: LessonKind;
  authoringStatus: AuthoringStatus;
  sceneCount: number;
  /** Scenes with nothing missing: what a learner would see. */
  readySceneCount: number;
};

export type PathwayRefView = { id: string; slug: string; title: string };

export type AuthoringModuleView = AuthoringModuleSummaryView & {
  pathway: PathwayRefView;
  lessons: AuthoringLessonSummaryView[];
};

export type AuthoringSceneSummaryView = {
  id: string;
  kind: LessonSceneKind;
  sequence: number;
  title: string;
  /** What it still needs before learners see it; empty when complete. */
  gaps: SceneGap[];
};

export type AuthoringLessonView = AuthoringLessonSummaryView & {
  module: { id: string; slug: string; title: string; status: PublishStatus };
  pathway: PathwayRefView;
  scenes: AuthoringSceneSummaryView[];
};

export type CurriculumItemInput = {
  title?: string;
  /** Null or empty clears it. */
  summary?: string | null;
};

export type MoveDirection = "UP" | "DOWN";

// ─── Scenes and their files ─────────────────────────────────────────────────

export type MediaFileView = {
  id: string;
  /** The name it was uploaded with. */
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: Date;
  /** A signed link to play or show it. It expires, so it is never stored. */
  url: string;
};

export type AuthoringSceneView = {
  id: string;
  kind: LessonSceneKind;
  sequence: number;
  title: string;
  body: string | null;
  /** Made from the captions file; null until captions are uploaded. */
  transcript: string | null;
  gaps: SceneGap[];
  lesson: { id: string; title: string; status: PublishStatus };
  module: { id: string; title: string };
  pathway: PathwayRefView;
  video: MediaFileView | null;
  captions: MediaFileView | null;
  poster: MediaFileView | null;
};

export type SceneInput = {
  title?: string;
  /** Null or empty clears it. */
  body?: string | null;
};

export type UploadRequestInput = {
  purpose: MediaPurpose;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

/** Where the browser sends one file, straight to storage. */
export type UploadTicketView = {
  assetId: string;
  url: string;
  method: "PUT";
  /** Must be sent exactly: they are part of the signature. */
  headers: Record<string, string>;
  expiresAt: Date;
};
