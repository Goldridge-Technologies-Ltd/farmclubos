import type {
  AssessmentKind,
  AuthoringStatus,
  LessonKind,
  LessonSceneKind,
  PathwayLevel,
} from "../../generated/prisma/enums.js";

/*
  The Academy catalogue as the web app reads it.

  Platform content, not tenant content: a pathway belongs to no institution,
  so these are the few reads in the API that carry no institution filter. What
  replaces it is the publication filter — only PUBLISHED, never archived — and
  it is applied at every level, so an unpublished module cannot be reached
  through a published pathway.

  Counts here are real platform data: they are the rows that exist, not
  illustrations (AGENTS.md).
*/

export type PathwaySummaryView = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: PathwayLevel;
  sequence: number;
  moduleCount: number;
};

export type PathwayDetailView = PathwaySummaryView & {
  description: string | null;
  modules: ModuleSummaryView[];
};

export type ModuleSummaryView = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  sequence: number;
  lessonCount: number;
  assessmentCount: number;
};

export type ModuleDetailView = ModuleSummaryView & {
  pathway: PathwayRefView;
  lessons: LessonSummaryView[];
  assessments: AssessmentSummaryView[];
};

export type PathwayRefView = { slug: string; title: string };

export type LessonSummaryView = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: LessonKind;
  /** PLACEHOLDER means the outline exists and the lesson is unwritten. */
  authoringStatus: AuthoringStatus;
  durationMinutes: number | null;
  sequence: number;
};

export type LessonLinkView = { slug: string; title: string };

/** A video scene's files, as links that play for a while and then expire. */
export type SceneVideoView = {
  url: string;
  contentType: string;
  captionsUrl: string;
  posterUrl: string;
};

/**
 * One screen of a lesson, as a learner gets it: only complete scenes are ever
 * included, so a video always has its captions and still image.
 */
export type LessonSceneView = {
  id: string;
  kind: LessonSceneKind;
  title: string;
  /** In the notes' formatting syntax. A notes scene always has one. */
  body: string | null;
  /** Made from the captions, for reading instead of or beside the video. */
  transcript: string | null;
  /** Null for a notes scene. */
  video: SceneVideoView | null;
};

export type LessonDetailView = LessonSummaryView & {
  /** Null while the lesson is an outline; the screen says so rather than blank. */
  body: string | null;
  /** In order. Empty while the lesson is still being authored. */
  scenes: LessonSceneView[];
  pathway: PathwayRefView;
  module: PathwayRefView;
  previous: LessonLinkView | null;
  next: LessonLinkView | null;
};

export type AssessmentSummaryView = {
  id: string;
  slug: string;
  title: string;
  kind: AssessmentKind;
  authoringStatus: AuthoringStatus;
  passMarkPercent: number;
  questionCount: number;
};
