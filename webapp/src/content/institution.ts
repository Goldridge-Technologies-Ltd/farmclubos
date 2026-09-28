/*
  Copy for the institution's management screens.

  Counts and progress come from the API, never from here: this file holds the
  words around them, including plurals, so a screen never says "1 learners".
*/

/** "1 open cohort place", "2 open cohort places". */
function openPlaces(count: number): string {
  return `${count} open cohort ${count === 1 ? "place" : "places"}`;
}

/** "1 learner", "2 learners". */
function learners(count: number): string {
  return `${count} ${count === 1 ? "learner" : "learners"}`;
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
      /** Read after Resend and Revoke, so a list of them can be told apart. */
      target: (email: string) => `the invitation to ${email}`,
      working: "Working…",
      // Shown at the top of the page: the invitation has left the list it sat in.
      revoked: (email: string) => `The invitation to ${email} was revoked. Its link no longer works.`,
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
    current: {
      title: "Current",
      empty: "No intake is open at the moment. Open a new one to enrol learners.",
    },
    past: {
      title: "Closed",
      description:
        "Intakes that have closed. Nobody new can join them; learners already on them can " +
        "still finish.",
    },
    enrolled: (count: number) => learners(count),
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
      // What closing an intake does; "Completed" would read as every learner finishing.
      COMPLETED: "Closed",
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
    edit: "Edit details",
    learnersTitle: "Learners",
    learnersEmpty: "Nobody is enrolled yet. Enrol a member below.",
    learnersEmptyClosed: "Nobody was enrolled on this intake.",
    progressLabel: (name: string) => `${name}'s progress`,
    enrolmentStatuses: {
      INVITED: "Invited",
      ACTIVE: "Active",
      COMPLETED: "Completed",
      WITHDRAWN: "Withdrawn",
    },
    withdraw: {
      label: "Withdraw",
      confirm: "Withdraw",
      busy: "Withdrawing…",
      consequence: (name: string, cohort: string) =>
        `Withdraw ${name} from ${cohort}? ${name} will no longer be able to open it. ` +
        `Progress is kept, and enrolling ${name} again picks up where it stopped.`,
      done: (name: string) => `${name} has been withdrawn. Progress is kept.`,
    },
    withdrawn: {
      title: "Withdrawn",
      description:
        "Learners taken off this intake. Their progress is kept, and enrolling one again " +
        "picks up where it stopped.",
      date: (date: string) => `Withdrawn ${date}`,
      enrolAgain: "Enrol again",
      busy: "Enrolling…",
      done: (name: string) => `${name} is enrolled again. Progress carries on from where it stopped.`,
      /** In place of Enrol again, for someone who has since left the institution. */
      notAMember: "No longer a member of your institution",
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
      everyoneEnrolledOrWithdrawn:
        "Every member of your institution is on this cohort, or listed under Withdrawn.",
      inviteLink: "Invite someone",
    },
    close: {
      title: "Close this intake",
      description:
        "Close it once everyone joining has been enrolled. Nobody new can be enrolled after " +
        "that, but learners on it can still finish, and you can reopen it.",
      label: "Close the intake",
      confirm: "Close the intake",
      busy: "Closing…",
      consequence: (cohort: string, stillWorking: number) =>
        `Close ${cohort}? Nobody new can be enrolled onto it.` +
        (stillWorking > 0
          ? ` The ${learners(stillWorking)} working through it can still finish.`
          : "") +
        " You can reopen it later.",
      done: (cohort: string) => `${cohort} is closed. Learners on it can still finish.`,
    },
    closed: {
      title: "This intake is closed",
      description:
        "Nobody new can be enrolled, and learners already on it can still finish their " +
        "pathway. Reopen it to enrol more learners, or to enrol a withdrawn learner again.",
      reopen: "Reopen the intake",
      busy: "Reopening…",
      done: (cohort: string) => `${cohort} is open again. You can enrol learners onto it.`,
    },
  },

  editCohort: {
    heading: "Edit details",
    description:
      "The pathway cannot be changed: the progress of everyone on this intake belongs to it. " +
      "To run a different pathway, open a new intake.",
    pathway: "Pathway",
    submit: "Save changes",
    busy: "Saving…",
    cancel: "Cancel",
  },
} as const;
