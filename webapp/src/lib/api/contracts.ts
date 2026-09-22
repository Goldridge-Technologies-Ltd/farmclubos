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
