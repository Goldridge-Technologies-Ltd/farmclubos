import type { ContentTeamRole } from "@/lib/api/contracts";

/*
  Copy for the platform's own screens, where a platform administrator adds
  institutions and invites the person who runs each one, and runs the content
  team that builds the Academy.

  No example names an institution, a place or a partner: an illustrative
  college and town in a placeholder reads as a real customer in a real
  location (AGENTS.md, Content Restrictions). Hints describe the field
  instead.
*/

export const platformContent = {
  crumb: "Platform",

  types: {
    SCHOOL: "School",
    TECHNICAL_COLLEGE: "Technical college",
    UNIVERSITY: "University",
    YOUTH_PROGRAMME: "Youth programme",
    GOVERNMENT_AGENCY: "Government agency",
    DEVELOPMENT_PARTNER: "Development partner",
    ENTERPRISE: "Enterprise",
    OTHER: "Other",
  },

  statuses: {
    PENDING: "Pending",
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
  },

  list: {
    eyebrow: "Platform",
    heading: "Institutions",
    description:
      "Every institution on FARMCLUB OS. Add one, then invite the person who will " +
      "run it; they invite everyone else.",
    add: "Add an institution",
    search: "Search by name",
    searchSubmit: "Search",
    clearSearch: "Clear",
    empty: {
      title: "No institutions yet",
      description: "Add the first institution, then invite its administrator.",
    },
    noMatches: (search: string) => `No institution's name contains “${search}”.`,
    showing: (shown: number, total: number) =>
      `Showing the first ${shown} of ${total}. Search to find the one you want.`,
    added: (date: string) => `Added ${date}`,
  },

  create: {
    heading: "Add an institution",
    description:
      "Add the institution, then invite the person who will run it. It is active " +
      "straight away.",
    fields: {
      name: "Name",
      type: "Type",
      typePlaceholder: "Choose a type",
      contactEmail: "Contact email",
      contactEmailHint:
        "Where FARMCLUB OS writes to the institution. It is not anyone's sign-in.",
      contactPhone: "Phone",
      website: "Website",
      websiteHint: "Starting with https://",
      addressLine: "Address",
      city: "City",
      country: "Country",
    },
    optionalHeading: "Contact details",
    optionalNote: "Optional, and can be added later.",
    submit: "Add the institution",
    busy: "Adding…",
    requiredNote: "Fields marked * are required.",
  },

  detail: {
    details: "Details",
    labels: {
      type: "Type",
      contactEmail: "Contact email",
      contactPhone: "Phone",
      website: "Website",
      address: "Address",
      added: "Added",
    },
    administrators: {
      title: "Administrators",
      description:
        "The people who run this institution. They invite its learners, open " +
        "its intakes and enrol people onto them.",
      none: "Nobody runs this institution yet. Invite its administrator below.",
    },
    invite: {
      title: "Invite an administrator",
      description:
        "They receive an email with a link to create their account. Once they " +
        "accept, they can invite everyone else themselves.",
      email: "Email address",
      submit: "Send invitation",
      busy: "Sending…",
    },
    pending: {
      title: "Waiting to accept",
      none: "No administrator invitations are waiting.",
    },
    members: (count: number) =>
      `${count} ${count === 1 ? "member" : "members"} in total, of every role.`,
  },

  contentTeam: {
    heading: "Content team",
    description:
      "The people who build the Academy for every institution: its modules and lessons, " +
      "with their videos and notes. Platform administrators are on it already; invite " +
      "content managers to join them.",
    members: {
      title: "On the team",
      description: "Everyone who can open Academy content and publish it to learners.",
      roles: {
        PLATFORM_ADMIN: "Platform administrator",
        CONTENT_MANAGER: "Content manager",
      } satisfies Record<ContentTeamRole, string>,
      remove: {
        label: "Remove",
        confirm: "Remove",
        busy: "Removing…",
        consequence: (name: string) =>
          `Remove ${name} from the content team? They can no longer build or publish the ` +
          "Academy. Their account, and everything they made, stays, and you can invite them again.",
        done: (name: string) => `${name} is no longer on the content team.`,
      },
    },
    invite: {
      title: "Invite a content manager",
      description:
        "They receive an email with a link. Someone new creates an account; someone who " +
        "already has one signs in and accepts. Either way, they can build the Academy " +
        "straight away.",
      email: "Email address",
      submit: "Send invitation",
      busy: "Sending…",
      sent: (email: string) => `Invitation sent to ${email}.`,
      emailFailed: (email: string) =>
        `The invitation to ${email} was created, but the email did not send. Send it again below.`,
    },
    pending: {
      title: "Waiting to accept",
      none: "No invitations are waiting.",
      expires: (date: string) => `Link valid until ${date}`,
      expired: (date: string) => `Expired on ${date}. Resend it for a fresh link.`,
      resent: "Sent again.",
    },
  },
} as const;
