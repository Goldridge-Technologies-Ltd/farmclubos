import type { EnrolmentStatus, ProgressStatus } from "../../generated/prisma/enums.js";

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
  cohort: { id: string; name: string };
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
