import type {
  AssessmentKind,
  AttemptStatus,
  AuthoringStatus,
  QuestionType,
} from "../../generated/prisma/enums.js";

/*
  Taking an assessment.

  `AssessmentOption.isCorrect` appears in none of these types. A learner's own
  result does — knowing whether *their* answer was right is the point of
  feedback — but which option was correct never leaves the service
  (api/AGENTS.md).
*/

export type AssessmentOptionView = {
  id: string;
  label: string;
  sequence: number;
};

export type AssessmentQuestionView = {
  id: string;
  prompt: string;
  helpText: string | null;
  type: QuestionType;
  points: number;
  sequence: number;
  /** Empty for a written answer. */
  options: AssessmentOptionView[];
};

export type AssessmentView = {
  id: string;
  slug: string;
  title: string;
  instructions: string | null;
  kind: AssessmentKind;
  authoringStatus: AuthoringStatus;
  passMarkPercent: number;
  /** Null means no limit. */
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  pathway: { slug: string; title: string };
  module: { slug: string; title: string };
  questions: AssessmentQuestionView[];
  /** Real counts from the caller's own attempts. */
  attemptsUsed: number;
  canAttempt: boolean;
};

export type AttemptResponseView = {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
  /** Null until graded, and null for a question no machine can grade. */
  isCorrect: boolean | null;
  pointsAwarded: number | null;
};

export type AttemptView = {
  id: string;
  assessmentId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: Date;
  submittedAt: Date | null;
  /** Out of the points that could be graded automatically. */
  scorePercent: number | null;
  passed: boolean | null;
  /**
   * Written answers, which are left for a person to mark. They are excluded
   * from the score rather than counted as wrong.
   */
  questionsAwaitingReview: number;
  responses: AttemptResponseView[];
};

/** One answer, as the web app sends it. */
export type AnswerInput = {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string | null;
};
