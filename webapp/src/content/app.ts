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

export type CapabilityScreen = {
  eyebrow: string;
  heading: string;
  description: string;
  /** What the section will do, as capability statements rather than promises. */
  capabilities: { title: string; description: string }[];
  empty: { title: string; description: string };
};

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
  menu: {
    open: "Open the menu",
    close: "Close the menu",
    account: "Your account",
    signedInAs: "Signed in as",
    noInstitution: "No institution yet",
    signOut: "Sign out",
    /** Where a platform administrator who belongs to no institution is working. */
    platform: "Platform administration",
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

/** The heading over a section's capabilities, before its data exists. */
export const capabilitiesHeading = "What this section does";

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
    "Everything you are working on lives here. Start in the Academy, then " +
    "practise, prove and build on what you learn.",
  sections: {
    heading: "Where to go",
    description: "The parts of FARMCLUB OS open to you right now.",
  },
  continue: {
    title: "Continue your pathway",
    cohort: (name: string) => `Cohort: ${name}`,
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
    title: "You are not enrolled on a pathway yet",
    description:
      "Your institution enrols you onto a cohort. Until then you can browse the " +
      "Academy; once you are enrolled, your pathway and progress appear here.",
    action: "Browse the Academy",
  },
  platform: {
    title: "Run the platform",
    description:
      "Add an institution and invite the person who will run it. They take it " +
      "from there: learners, intakes and enrolments are theirs to manage.",
    action: "Institutions",
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
    "Every lesson completed, assessment passed and competency verified, in " +
    "one place.",
  notEnrolled: {
    title: "You are not enrolled on a pathway yet",
    description:
      "Your institution enrols you onto a cohort. Once that happens, your " +
      "pathway and everything you complete will be listed here.",
    action: "Browse the Academy",
  },
  cohort: (name: string) => `Cohort: ${name}`,
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

export const experienceScreen: CapabilityScreen = {
  eyebrow: "Practise",
  heading: "Experience",
  description:
    "Learning becomes skill in a working environment. The Experience & " +
    "Innovation Hub is where a pathway leaves the screen.",
  capabilities: [
    {
      title: "Book a session",
      description:
        "Reserve a place on a practical activity at a site running your " +
        "pathway's programme.",
    },
    {
      title: "Attend and be recorded",
      description:
        "Attendance is registered on the day, so the work you have actually " +
        "done is the record — not a self-report.",
    },
    {
      title: "Have a competency verified",
      description:
        "A verifier signs off what you can do against the criteria for that " +
        "competency, with the evidence attached.",
    },
  ],
  empty: {
    title: "No sessions available to you yet",
    description:
      "Sessions appear here once your institution schedules them for a site " +
      "running your pathway.",
  },
};

export const mentorshipScreen: CapabilityScreen = {
  eyebrow: "Connect",
  heading: "Mentorship",
  description:
    "Guidance from people who have already built what you are trying to " +
    "build, matched to where you are.",
  capabilities: [
    {
      title: "Be matched to a mentor",
      description:
        "Matching considers your pathway, your stage and what you are trying " +
        "to do next.",
    },
    {
      title: "Hold a conversation that persists",
      description:
        "Each engagement keeps its own thread, so advice can be returned to " +
        "rather than remembered.",
    },
    {
      title: "Work towards something",
      description:
        "An engagement is tied to what you are building, not left as an open " +
        "chat.",
    },
  ],
  empty: {
    title: "No mentorship engagement yet",
    description:
      "Mentors are matched once you are further into a pathway. Nothing is " +
      "needed from you now.",
  },
};

export const enterpriseScreen: CapabilityScreen = {
  eyebrow: "Build",
  heading: "Enterprise",
  description:
    "The point of the programme: a real operation, planned and tracked from " +
    "the skills you have proven.",
  capabilities: [
    {
      title: "Plan a venture",
      description:
        "Set out what you intend to produce and how, against the competencies " +
        "you hold.",
    },
    {
      title: "Track it in milestones",
      description:
        "Break the plan into steps with dates you set, and record what " +
        "actually happened.",
    },
    {
      title: "Keep the paperwork with it",
      description:
        "Registrations, agreements and records stay attached to the venture " +
        "they belong to.",
    },
  ],
  empty: {
    title: "No venture yet",
    description:
      "An enterprise is created once you have completed a pathway and had " +
      "your competencies verified.",
  },
};
