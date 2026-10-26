/*
  Copy for the app shell and the screens inside it.

  Copy is never hardcoded in JSX (docs/design-system.md §13, and
  docs/webapp/design-patterns.md §5). Terminology follows
  docs/content-rules.md: "learner" in the platform and institution context,
  "participant" only at a Hub, and the "Experience & Innovation Hub" is never
  shortened to "Experience Hub".

  No figures appear here. In the web app a number may only come from real
  platform data, so a count, a percentage or a date belongs to the component
  that received it from the API, never to a content file.
*/

export const appShell = {
  skipLink: "Skip to main content",
  /** The logo link, which carries no visible text of its own. */
  homeLink: "FARMCLUB OS home",
  /** Labelled landmarks, so a screen reader can tell the regions apart. */
  landmarks: {
    sidebar: "Sections",
    drawer: "Sections",
    breadcrumb: "Breadcrumb",
    account: "Account",
  },
  /** Above each role's own links in the sidebar and the drawer. */
  manageHeading: "Manage",
  platformHeading: "Platform",
  contentHeading: "Content",
  /** Above the sections that are not built yet, after everything that works. */
  plannedHeading: "Planned",
  menu: {
    open: "Open the menu",
    close: "Close the menu",
    account: "Your account",
    signedInAs: "Signed in as",
    noInstitution: "No institution yet",
    /** Where someone who signed up on their own is learning. */
    independentLearning: "Independent learning",
    signOut: "Sign out",
    /** Where a platform administrator who belongs to no institution is working. */
    platform: "Platform administration",
    /** Where a content manager who belongs to no institution is working. */
    contentTeam: "Content team",
    /** Above the institutions to switch between, for someone in more than one. */
    institutions: "Your institutions",
    /** Read before an institution's name on its button; not shown. */
    switchTo: "Switch to",
    switching: "Switching…",
  },
  roles: {
    INSTITUTION_ADMIN: "Institution administrator",
    FACILITATOR: "Facilitator",
    MENTOR: "Mentor",
    LEARNER: "Learner",
    PLATFORM_ADMIN: "Platform administrator",
    CONTENT_MANAGER: "Content manager",
    NONE: "Member",
  },
} as const;

/** The fixed words of an action that asks before it acts (`ConfirmAction`). */
export const confirmActionCopy = {
  cancel: "Cancel",
} as const;

/** Announced while a screen's data loads; each Skeleton itself is silent. */
export const loadingLabel = "Loading";

/** What the root error boundary shows, outside any section of the app. */
export const rootErrorScreen = {
  heading: "Something went wrong",
  description:
    "We could not finish that. Try again, and if it keeps happening, tell your " +
    "institution’s administrator.",
  retry: "Try again",
} as const;

export const notFoundScreen = {
  title: "Page not found",
  description:
    "The page you were looking for does not exist, or you no longer have access to it.",
  action: "Go to your dashboard",
} as const;

export const errorScreen = {
  title: "That did not load",
  description:
    "Something went wrong on our side. Trying again usually settles it; if it " +
    "does not, come back in a few minutes.",
  retry: "Try again",
} as const;

export const homeScreen = {
  greeting: (firstName: string) => `Welcome, ${firstName}`,
  eyebrow: "Your dashboard",
  description:
    "Everything you are working on lives here. Start in the Academy.",
  sections: {
    heading: "Where to go",
    description: "The parts of FARMCLUB OS open to you right now.",
  },
  continue: {
    title: "Continue your pathway",
    cohort: (name: string) => `Cohort: ${name}`,
    cohortClosed: (name: string) =>
      `Cohort: ${name}. It has closed to new learners; you can still finish.`,
    selfPaced: "Self-paced: you are taking this pathway on your own.",
    selfPacedClosed:
      "Self-paced. This pathway has closed to new learners; you can still finish.",
    through: "through this pathway",
    // Only name the module when it adds something: a module's opening lesson
    // often shares its title.
    next: (lesson: string, module: string) =>
      lesson === module ? `Next: ${lesson}` : `Next: ${lesson}, in ${module}`,
    action: "Continue",
    finished: "You have completed every lesson in this pathway.",
    journey: "See your journey",
  },
  notEnrolled: {
    title: "You have not started a pathway yet",
    description:
      "Start any pathway in the Academy and learn at your own pace; it appears here " +
      "with your progress. A pathway your institution enrols you on appears here too.",
    action: "Browse the Academy",
  },
  content: {
    title: "Academy content",
    description:
      "Build the Academy's modules and lessons, and fill them with videos and notes.",
    action: "Open Academy content",
  },
  platform: {
    title: "Run the platform",
    description:
      "Add an institution and invite the person who will run it. They take it " +
      "from there: learners, intakes and enrolments are theirs to manage. Invite " +
      "content managers to the content team that builds the Academy.",
    action: "Institutions",
    contentTeam: "Content team",
  },
  manage: {
    title: "Run your institution",
    description:
      "Invite people to join, open an intake of a pathway, and enrol members onto it.",
    members: "Members and invitations",
    cohorts: "Cohorts",
  },
} as const;

export const journeyScreen = {
  eyebrow: "Progress",
  heading: "My Journey",
  description:
    "Every module and lesson in your pathway, and how far you have come in each.",
  notEnrolled: {
    title: "You have not started a pathway yet",
    description:
      "Start a pathway from the Academy, or be enrolled on one by your institution, and " +
      "everything you complete will be listed here.",
    action: "Browse the Academy",
  },
  cohort: (name: string) => `Cohort: ${name}`,
  cohortClosed: (name: string) =>
    `Cohort: ${name}. It has closed to new learners; you can still finish.`,
  selfPaced: "Self-paced: you are taking this pathway on your own.",
  selfPacedClosed:
    "Self-paced. This pathway has closed to new learners; you can still finish.",
  through: "through this pathway",
  moduleProgress: (done: number, total: number) =>
    `${done} of ${total} ${total === 1 ? "lesson" : "lessons"} complete`,
  statuses: {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Complete",
  },
  enrolmentStatuses: {
    INVITED: "Invited",
    ACTIVE: "In progress",
    COMPLETED: "Completed",
    WITHDRAWN: "Withdrawn",
  },
} as const;

export const profileScreen = {
  crumb: "Settings",
  heading: "Profile",
  description: "What FARMCLUB OS holds about you, and where you belong.",
  details: "Your details",
  memberships: "Institutions",
  membershipsNote:
    "The institutions you are a member of, and your role in each. Roles are " +
    "set by an institution administrator.",
  noMemberships: "You are not a member of an institution yet.",
  labels: {
    name: "Name",
    email: "Email",
  },
} as const;
