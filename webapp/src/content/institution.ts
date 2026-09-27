/*
  Copy for the institution's management screens.

  Counts and progress come from the API, never from here: this file holds the
  words around them, including plurals, so a screen never says "1 learners".
*/

/** "1 open cohort place", "2 open cohort places". */
function openPlaces(count: number): string {
  return `${count} open cohort ${count === 1 ? "place" : "places"}`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const institutionContent = {
  crumb: "Manage",

  roles: {
    LEARNER: "Learner",
    FACILITATOR: "Facilitator",
    MENTOR: "Mentor",
    INSTITUTION_ADMIN: "Institution administrator",
  },

  members: {
    eyebrow: "Manage",
    heading: "Members",
    description:
      "Everyone who belongs to your institution. A person joins by accepting an " +
      "invitation; only then can they be enrolled onto a cohort.",
    invite: {
      title: "Invite someone",
      description: "They receive an email with a link to create their account and join.",
      email: "Email address",
      role: "Role",
      submit: "Send invitation",
      busy: "Sending…",
    },
    list: {
      title: "Members",
      empty: "Nobody has joined yet. Invite someone above.",
      joined: (date: string) => `Joined ${date}`,
      /** In place of Remove: an institution always keeps one administrator. */
      onlyAdministrator: "The only administrator",
    },
    remove: {
      label: "Remove",
      confirm: "Remove",
      busy: "Removing…",
      consequence: (name: string, institution: string, openEnrolments: number) =>
        `Remove ${name} from ${institution}? ${name} will lose access straight away` +
        (openEnrolments > 0
          ? `, and ${openPlaces(openEnrolments)} will be withdrawn; progress is kept.`
          : ".") +
        ` A new invitation brings ${name} back.`,
      consequenceForYou: (institution: string, openEnrolments: number) =>
        `Remove yourself from ${institution}? You will lose access to it straight away, ` +
        "these screens included" +
        (openEnrolments > 0
          ? `, and your ${openPlaces(openEnrolments)} will be withdrawn; progress is kept.`
          : ".") +
        " Another administrator can invite you back.",
      done: (name: string, institution: string, enrolmentsWithdrawn: number) =>
        `${name} has been removed from ${institution}.` +
        (enrolmentsWithdrawn > 0
          ? ` ${capitalise(openPlaces(enrolmentsWithdrawn))} ${
              enrolmentsWithdrawn === 1 ? "was" : "were"
            } withdrawn.`
          : ""),
    },
    pending: {
      title: "Waiting to accept",
      description: "Invitations sent but not yet accepted.",
      empty: "No invitations are waiting.",
      expires: (date: string) => `Link valid until ${date}`,
      resend: "Resend",
      revoke: "Revoke",
      working: "Working…",
    },
  },

  cohorts: {
    eyebrow: "Manage",
    heading: "Cohorts",
    description:
      "A cohort is one intake of a pathway. Open one, then enrol members onto it; " +
      "each learner's progress is recorded against their place in it.",
    create: "Open a new intake",
    empty: {
      title: "No cohorts yet",
      description: "Open an intake of a pathway to start enrolling learners onto it.",
    },
    enrolled: (count: number) => `${count} ${count === 1 ? "learner" : "learners"}`,
    dates: (startsOn: string | null, endsOn: string | null) =>
      startsOn && endsOn
        ? `${startsOn} to ${endsOn}`
        : startsOn
          ? `Starts ${startsOn}`
          : "No dates set",
    statuses: {
      PLANNED: "Planned",
      OPEN: "Open",
      RUNNING: "Running",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    },
    deliveryModes: {
      ONLINE: "Online",
      BLENDED: "Blended",
      IN_PERSON: "In person",
    },
  },

  newCohort: {
    heading: "Open a new intake",
    description:
      "Choose the pathway this intake will take. You can enrol learners as soon as " +
      "it is open.",
    fields: {
      pathway: "Pathway",
      pathwayPlaceholder: "Choose a pathway",
      name: "Name",
      nameHint: "What your institution calls this intake, such as “September intake”.",
      code: "Code",
      codeHint: "Optional. Your own reference for it.",
      deliveryMode: "How it is delivered",
      startsOn: "Starts",
      endsOn: "Ends",
    },
    submit: "Open the intake",
    busy: "Opening…",
    requiredNote: "Fields marked * are required.",
  },

  cohort: {
    learnersTitle: "Learners",
    learnersEmpty: "Nobody is enrolled yet. Enrol a member below.",
    progressLabel: (name: string) => `${name}'s progress`,
    enrolmentStatuses: {
      INVITED: "Invited",
      ACTIVE: "Active",
      COMPLETED: "Completed",
      WITHDRAWN: "Withdrawn",
    },
    enrol: {
      title: "Enrol a member",
      description:
        "Only people who have already joined your institution can be enrolled. " +
        "To enrol someone new, invite them from Members first.",
      member: "Member",
      memberPlaceholder: "Choose a member",
      submit: "Enrol",
      busy: "Enrolling…",
      everyoneEnrolled: "Every member of your institution is already on this cohort.",
      inviteLink: "Invite someone",
    },
  },
} as const;
