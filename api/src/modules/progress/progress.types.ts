import type {
  CohortStatus,
  EnrolmentStatus,
  ProgressStatus,
} from "../../generated/prisma/enums.js";

/*
  A learner's progress through the pathway they are enrolled on.

  Every figure here is counted from rows that exist: lessons actually marked
  complete, out of the published lessons in the pathway. Nothing is estimated,
  defaulted to something plausible, or rounded up to look better (AGENTS.md).
*/

export type LessonProgressView = {
  lessonId: string;
  slug: string;
  title: string;
  status: ProgressStatus;
  completedAt: Date | null;
};

export type ModuleProgressView = {
  moduleId: string;
  slug: string;
  title: string;
  sequence: number;
  status: ProgressStatus;
  /** Real counts: completed out of published. */
  lessonsCompleted: number;
  lessonCount: number;
  lessons: LessonProgressView[];
};

export type JourneyView = {
  enrolmentId: string;
  status: EnrolmentStatus;
  /** Derived from completed lessons, not stored optimistically. */
  progressPercent: number;
  /**
   * The intake's status too: a closed one takes nobody new, but its learners
   * can still finish, and should be told which it is.
   */
  cohort: { id: string; name: string; status: CohortStatus };
  pathway: { id: string; slug: string; title: string };
  modules: ModuleProgressView[];
};

/** What completing a lesson changes, so a screen can update without refetching. */
export type LessonCompletionView = {
  lessonId: string;
  status: ProgressStatus;
  completedAt: Date | null;
  moduleStatus: ProgressStatus;
  progressPercent: number;
};

/** What finishing one scene changed. */
export type SceneCompletionView = {
  sceneId: string;
  /** The lesson's complete scenes the caller has finished, this one included. */
  scenesCompleted: number;
  sceneCount: number;
  /** True once every scene is done: the lesson is then complete. */
  lessonCompleted: boolean;
  /** The caller's percentage through the pathway, when this completed the lesson. */
  progressPercent: number | null;
};

/** Where the caller stands in one lesson, for resuming at the right scene. */
export type LessonStandingView = {
  /** False for anyone reading a lesson they are not enrolled on. */
  enrolled: boolean;
  status: ProgressStatus;
  completedSceneIds: string[];
};
