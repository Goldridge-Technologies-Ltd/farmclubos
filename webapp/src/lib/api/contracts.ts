/*
  The shapes the API returns, as this app consumes them.

  They are declared here rather than imported from `api/`: the two are separate
  deployables and never share a build. `api/AGENTS.md` carries the other half
  of the bargain — a change to a response shape the web app consumes updates
  this file in the same change.

  Only the fields this app actually uses are listed. A field the API adds and
  nothing here reads does not belong here.
*/

export type PlatformRole = "PLATFORM_ADMIN" | "CONTENT_MANAGER" | "NONE";

export type InstitutionRole =
  | "INSTITUTION_ADMIN"
  | "FACILITATOR"
  | "MENTOR"
  | "LEARNER";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: PlatformRole;
};

export type MembershipSummary = {
  institutionId: string;
  institutionName: string;
  institutionSlug: string;
  role: InstitutionRole;
};

/** What `/auth/me` returns: who is signed in, and where they are working. */
export type SessionContext = {
  user: SessionUser;
  activeInstitutionId: string | null;
  institutionRole: InstitutionRole | null;
  memberships: MembershipSummary[];
};

/** What sign-in and invite acceptance return: a session context plus tokens. */
export type AuthSession = SessionContext & {
  accessToken: string;
  /** ISO 8601. */
  accessTokenExpiresAt: string;
  refreshToken: string;
  /** ISO 8601. */
  refreshTokenExpiresAt: string;
};

/** What switching institution returns: a new access token, and nothing else. */
export type SwitchedInstitution = {
  accessToken: string;
  /** ISO 8601. */
  accessTokenExpiresAt: string;
  activeInstitutionId: string;
  institutionRole: InstitutionRole;
};

export type InviteLookup = {
  email: string;
  role: InstitutionRole;
  /** ISO 8601. */
  expiresAt: string;
  /** True when the invitee should sign in and join rather than sign up. */
  accountExists: boolean;
  institution: { id: string; name: string };
};

/* ── Academy ──────────────────────────────────────────────────────────────
   The catalogue. Counts are real row counts from the API; `durationMinutes`
   and the pathway's estimated hours are null until someone authors them, and
   are never filled in here (AGENTS.md).
*/

export type PathwayLevel = "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
export type LessonKind = "TEXT" | "VIDEO" | "DOWNLOAD" | "PRACTICAL";
export type AuthoringStatus = "PLACEHOLDER" | "IN_REVIEW" | "AUTHORED";
export type AssessmentKind = "QUIZ" | "SUBMISSION" | "PRACTICAL";

export type PathwaySummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: PathwayLevel;
  sequence: number;
  moduleCount: number;
};

export type ModuleSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  sequence: number;
  lessonCount: number;
  assessmentCount: number;
};

export type PathwayDetail = PathwaySummary & {
  description: string | null;
  modules: ModuleSummary[];
};

export type PathwayRef = { slug: string; title: string };

export type LessonSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: LessonKind;
  authoringStatus: AuthoringStatus;
  durationMinutes: number | null;
  sequence: number;
};

export type AssessmentSummary = {
  id: string;
  slug: string;
  title: string;
  kind: AssessmentKind;
  authoringStatus: AuthoringStatus;
  passMarkPercent: number;
  questionCount: number;
};

export type ModuleDetail = ModuleSummary & {
  pathway: PathwayRef;
  lessons: LessonSummary[];
  assessments: AssessmentSummary[];
};

export type LessonDetail = LessonSummary & {
  /** Null while the lesson is an outline; the screen says so. */
  body: string | null;
  pathway: PathwayRef;
  module: PathwayRef;
  previous: PathwayRef | null;
  next: PathwayRef | null;
};

/* ── Enrolments ───────────────────────────────────────────────────────── */

export type CohortStatus = "PLANNED" | "OPEN" | "RUNNING" | "COMPLETED" | "CANCELLED";
export type EnrolmentStatus = "INVITED" | "ACTIVE" | "COMPLETED" | "WITHDRAWN";
export type DeliveryMode = "IN_PERSON" | "ONLINE" | "BLENDED";

export type CohortSummary = {
  id: string;
  name: string;
  code: string | null;
  status: CohortStatus;
  deliveryMode: DeliveryMode;
  /** `YYYY-MM-DD`, or null when the institution has not set one. */
  startsOn: string | null;
  endsOn: string | null;
  pathway: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    level: PathwayLevel;
  };
};

export type Enrolment = {
  id: string;
  status: EnrolmentStatus;
  /** Derived from completed lessons by the API. Never illustrative. */
  progressPercent: number;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cohort: CohortSummary;
};

/* ── Progress ─────────────────────────────────────────────────────────────
   Every figure comes from rows the API counted. Nothing here is estimated.
*/

export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "ABANDONED";
export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER";

export type LessonProgress = {
  lessonId: string;
  slug: string;
  title: string;
  status: ProgressStatus;
  completedAt: string | null;
};

export type ModuleProgress = {
  moduleId: string;
  slug: string;
  title: string;
  sequence: number;
  status: ProgressStatus;
  lessonsCompleted: number;
  lessonCount: number;
  lessons: LessonProgress[];
};

export type Journey = {
  enrolmentId: string;
  status: EnrolmentStatus;
  progressPercent: number;
  /** A closed intake takes nobody new; its learners can still finish. */
  cohort: { id: string; name: string; status: CohortStatus };
  pathway: { id: string; slug: string; title: string };
  modules: ModuleProgress[];
};

export type LessonCompletion = {
  lessonId: string;
  status: ProgressStatus;
  completedAt: string | null;
  moduleStatus: ProgressStatus;
  progressPercent: number;
};

/* ── Assessments ──────────────────────────────────────────────────────────
   No type here carries an option's correctness. A learner is told whether
   their own answer was right, never which answer was.
*/

export type AssessmentOption = { id: string; label: string; sequence: number };

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  helpText: string | null;
  type: QuestionType;
  points: number;
  sequence: number;
  /** Empty for a written answer. */
  options: AssessmentOption[];
};

export type Assessment = {
  id: string;
  slug: string;
  title: string;
  instructions: string | null;
  kind: AssessmentKind;
  authoringStatus: AuthoringStatus;
  passMarkPercent: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  pathway: PathwayRef;
  module: PathwayRef;
  questions: AssessmentQuestion[];
  attemptsUsed: number;
  canAttempt: boolean;
};

export type AttemptResponse = {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
};

export type Attempt = {
  id: string;
  assessmentId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  /** Out of the points that could be graded automatically. */
  scorePercent: number | null;
  passed: boolean | null;
  questionsAwaitingReview: number;
  responses: AttemptResponse[];
};

/* ── Institution administration ───────────────────────────────────────── */

export type Member = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: InstitutionRole;
  joinedAt: string | null;
  /** Their cohort places here that are not finished: what removing them withdraws. */
  openEnrolments: number;
};

export type RemovedMember = { userId: string; enrolmentsWithdrawn: number };

export type InviteStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

export type Invite = {
  id: string;
  email: string;
  role: InstitutionRole;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; firstName: string; lastName: string };
};

/** FAILED means the invite exists but its email did not go: resend it. */
export type IssuedInvite = Invite & { emailStatus: "SENT" | "FAILED" };

export type CohortListItem = CohortSummary & { enrolmentCount: number };

export type CohortEnrolment = {
  id: string;
  status: EnrolmentStatus;
  /** Derived from completed lessons by the API. */
  progressPercent: number;
  enrolledAt: string;
  /** Set while withdrawn: when it happened. */
  withdrawnAt: string | null;
  learner: { userId: string; firstName: string; lastName: string; email: string };
};

export type CohortDetail = CohortSummary & { enrolments: CohortEnrolment[] };

/* ── Platform administration ──────────────────────────────────────────── */

export type InstitutionType =
  | "SCHOOL"
  | "TECHNICAL_COLLEGE"
  | "UNIVERSITY"
  | "YOUTH_PROGRAMME"
  | "GOVERNMENT_AGENCY"
  | "DEVELOPMENT_PARTNER"
  | "ENTERPRISE"
  | "OTHER";

export type InstitutionStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export type Institution = {
  id: string;
  slug: string;
  name: string;
  type: InstitutionType;
  status: InstitutionStatus;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
};
