import type {
  AuthoringStatus,
  LessonKind,
  LessonSceneKind,
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
