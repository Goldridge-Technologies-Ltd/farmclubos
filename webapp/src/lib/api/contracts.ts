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
  /**
   * FARMCLUB's home for people learning on their own. Screens call it
   * independent learning and never show it as an institution.
   */
  independentLearners: boolean;
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

/** What starting a pathway on one's own gave. */
export type StartedPathway = {
  enrolmentId: string;
  /** ACTIVE, or COMPLETED for a pathway already finished. */
  status: EnrolmentStatus;
  /** A new access token when the session moved to independent learning. */
  session: SwitchedInstitution | null;
};

/** What accepting an invitation gives: a place in an institution, or on the content team. */
export type InviteKind = "INSTITUTION" | "CONTENT_TEAM";

/** SIGNUP: a link someone sent themselves by signing up, to learn on their own. */
export type InviteLookupKind = InviteKind | "SIGNUP";

export type InviteLookup = {
  email: string;
  kind: InviteLookupKind;
  /** Null for the content team. */
  role: InstitutionRole | null;
  /** ISO 8601. */
  expiresAt: string;
  /** True when the invitee should sign in and join rather than sign up. */
  accountExists: boolean;
  /** Null for the content team, which belongs to no institution. */
  institution: { id: string; name: string } | null;
};

/** What joining with an existing account gave. */
export type InviteJoined = {
  kind: InviteKind;
  /** Null for the content team. */
  membership: MembershipSummary | null;
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

export type SceneKind = "VIDEO" | "NOTES";

/** A video scene's files, as signed links that play for a while, then expire. */
export type SceneVideo = {
  url: string;
  contentType: string;
  /** Null when the scene has no captions, which are optional. */
  captionsUrl: string | null;
  posterUrl: string;
};

/** One screen of a lesson. Only complete scenes ever reach a learner. */
export type LessonScene = {
  id: string;
  kind: SceneKind;
  title: string;
  /** In the notes' formatting syntax. */
  body: string | null;
  /** Made from the captions; null without them. */
  transcript: string | null;
  /** Null for a notes scene. */
  video: SceneVideo | null;
};

export type LessonDetail = LessonSummary & {
  /** In order. Empty while the lesson is still being authored. */
  scenes: LessonScene[];
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
  /** The always-open cohort independent learners join by starting the pathway. */
  selfPaced: boolean;
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
  /**
   * A closed intake takes nobody new; its learners can still finish. A
   * self-paced one is a pathway the learner started on their own.
   */
  cohort: { id: string; name: string; status: CohortStatus; selfPaced: boolean };
  pathway: { id: string; slug: string; title: string };
  modules: ModuleProgress[];
};

/** Where the caller stands in one lesson, for resuming at the right scene. */
export type LessonStanding = {
  /** False for someone reading a lesson they are not enrolled on. */
  enrolled: boolean;
  status: ProgressStatus;
  completedSceneIds: string[];
};

export type SceneCompletion = {
  sceneId: string;
  scenesCompleted: number;
  sceneCount: number;
  /** True once every scene is done: the lesson is then complete. */
  lessonCompleted: boolean;
  progressPercent: number | null;
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
  /** Null for someone who signed up themselves. */
  invitedBy: { id: string; firstName: string; lastName: string } | null;
};

/** FAILED means the invite exists but its email did not go: resend it. */
export type IssuedInvite = Invite & { emailStatus: "SENT" | "FAILED" };

/* ── Content team ─────────────────────────────────────────────────────────
   GET /content-team and its actions; platform administrators only. */

/** The platform roles that put someone on the content team. */
export type ContentTeamRole = Exclude<PlatformRole, "NONE">;

export type ContentTeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  platformRole: ContentTeamRole;
};

/** An invitation onto the content team: pending, or expired and resendable. */
export type ContentTeamInvite = {
  id: string;
  email: string;
  status: InviteStatus;
  /** ISO 8601. */
  expiresAt: string;
  /** ISO 8601. */
  createdAt: string;
  /** Null for someone who signed up themselves. */
  invitedBy: { id: string; firstName: string; lastName: string } | null;
};

export type IssuedContentTeamInvite = ContentTeamInvite & { emailStatus: "SENT" | "FAILED" };

export type ContentTeam = {
  /** Platform administrators first, then content managers, each by name. */
  members: ContentTeamMember[];
  invitations: ContentTeamInvite[];
};

/** Whoever was taken off the content team; their account stays. */
export type RemovedContentManager = { id: string; firstName: string; lastName: string; email: string };

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

/** INDEPENDENT_LEARNERS is FARMCLUB's own home for people who signed up themselves. */
export type InstitutionKind = "STANDARD" | "INDEPENDENT_LEARNERS";

export type Institution = {
  id: string;
  slug: string;
  name: string;
  type: InstitutionType;
  /** The independent learners' home cannot be edited. */
  kind: InstitutionKind;
  status: InstitutionStatus;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
};

/* ── Academy authoring ────────────────────────────────────────────────────
   The content team's view of the catalogue: drafts and archived items too.
   Counts are real row counts from the API.
*/

export type PublishStatus = "DRAFT" | "PUBLISHED" | "RETIRED";
export type MediaPurpose = "VIDEO" | "CAPTIONS" | "POSTER";
/** Something a scene still needs before learners can see it. Captions never are. */
export type SceneGap = "VIDEO" | "POSTER" | "BODY";

export type AuthoringPathwaySummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: PathwayLevel;
  sequence: number;
  status: PublishStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  moduleCount: number;
  publishedModuleCount: number;
};

export type AuthoringModuleSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  sequence: number;
  status: PublishStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  lessonCount: number;
  publishedLessonCount: number;
};

export type AuthoringPathway = AuthoringPathwaySummary & {
  description: string | null;
  modules: AuthoringModuleSummary[];
};

export type AuthoringLessonSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  sequence: number;
  status: PublishStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  kind: LessonKind;
  authoringStatus: AuthoringStatus;
  sceneCount: number;
  readySceneCount: number;
};

type Ref = { id: string; slug: string; title: string };

export type AuthoringModule = AuthoringModuleSummary & {
  pathway: Ref;
  lessons: AuthoringLessonSummary[];
};

export type AuthoringSceneSummary = {
  id: string;
  kind: SceneKind;
  sequence: number;
  title: string;
  gaps: SceneGap[];
};

export type AuthoringLesson = AuthoringLessonSummary & {
  module: Ref & { status: PublishStatus };
  pathway: Ref;
  scenes: AuthoringSceneSummary[];
};

export type MediaFile = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  /** A signed link; it expires. */
  url: string;
};

export type AuthoringScene = {
  id: string;
  kind: SceneKind;
  sequence: number;
  title: string;
  body: string | null;
  transcript: string | null;
  gaps: SceneGap[];
  lesson: { id: string; title: string; status: PublishStatus };
  module: { id: string; title: string };
  pathway: Ref;
  video: MediaFile | null;
  captions: MediaFile | null;
  poster: MediaFile | null;
};

/** Where the browser sends one file, straight to storage. */
export type UploadTicket = {
  assetId: string;
  url: string;
  method: "PUT";
  /** Sent exactly: they are part of the signature. */
  headers: Record<string, string>;
  expiresAt: string;
};
