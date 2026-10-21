/*
  The sections of the ecosystem that are not built yet: Experience,
  Mentorship, Enterprise, Marketplace and Finance.

  Each is built once the layer beneath it works. Practical sessions need
  activities to run and competencies to verify against; mentorship needs
  mentors; an enterprise needs a pathway behind it; and a marketplace with
  nothing produced on it, or lending with no record to lend against, is a
  screen pretending to be a product. So every page says plainly that its
  section is planned, and nothing that is not operational passes for a working
  service. Saying so is better than hiding the sections, because they are part
  of how FARMCLUB OS fits together.

  GUARDRAILS (AGENTS.md, docs/design-system.md §13). Nothing here may read as
  a commitment or a forecast: no dates, no order of delivery, no figures, no
  partner names, and no claim about what a service will offer on what terms.
  It says what the capability is for and what has to be true first — nothing
  more.
*/

export type FutureCapability = {
  eyebrow: string;
  heading: string;
  description: string;
  /** The single badge on the page. Sanctioned for exactly this use. */
  badge: string;
  /** What has to exist before the section can be real. */
  dependsOn: { title: string; description: string }[];
  /** What to do in the meantime, pointing at something that does exist. */
  meanwhile: { title: string; description: string; action: string; href: string };
};

/** The same for every future section: what the page's first panel is. */
export const futureCapabilityPanel = {
  dependsOnTitle: "What has to come first",
  dependsOnDescription:
    "This part of the ecosystem is built on the ones beneath it, and opens when they are real.",
} as const;

/** Every planned section carries the same badge. */
const planned = "Planned";

export const experienceCapability: FutureCapability = {
  eyebrow: "Practise",
  heading: "Experience",
  description:
    "Learning becomes skill in a working environment. The Experience & " +
    "Innovation Hub is where a pathway leaves the screen.",
  badge: planned,
  dependsOn: [
    {
      title: "Practical activities for each pathway",
      description:
        "A session needs an activity tied to what a pathway teaches, and a " +
        "site able to run it.",
    },
    {
      title: "A record made on the day",
      description:
        "What a learner did has to be recorded where they did it, by the " +
        "person who saw it, rather than reported afterwards.",
    },
    {
      title: "Competencies to verify against",
      description:
        "A verifier signs off what a learner can do against a competency's " +
        "criteria, so the competency framework comes first.",
    },
  ],
  meanwhile: {
    title: "Start with the Academy",
    description: "The pathways teach what the practical sessions will put to work.",
    action: "Open the Academy",
    href: "/academy",
  },
};

export const mentorshipCapability: FutureCapability = {
  eyebrow: "Connect",
  heading: "Mentorship",
  description:
    "Guidance from people who have already built what you are trying to " +
    "build, matched to where you are.",
  badge: planned,
  dependsOn: [
    {
      title: "Mentors on the platform",
      description:
        "Experienced practitioners have to be invited and prepared before " +
        "anyone can be matched to them.",
    },
    {
      title: "Learners working towards something",
      description:
        "A mentor's time counts most against an enterprise a learner is " +
        "actually building.",
    },
  ],
  meanwhile: {
    title: "Start with the Academy",
    description: "The pathways are where an enterprise worth mentoring begins.",
    action: "Open the Academy",
    href: "/academy",
  },
};

export const enterpriseCapability: FutureCapability = {
  eyebrow: "Build",
  heading: "Enterprise",
  description:
    "The point of the programme: a real operation, planned and tracked from " +
    "the skills you have proven.",
  badge: planned,
  dependsOn: [
    {
      title: "A pathway behind it",
      description: "Planning a venture builds on what the pathways teach.",
    },
    {
      title: "Competencies proven",
      description:
        "A venture plan rests on what a learner has shown they can do, not on " +
        "what they intend.",
    },
  ],
  meanwhile: {
    title: "Start with the Academy",
    description:
      "Work through your pathway. What you learn there is what a venture is " +
      "built on.",
    action: "Open the Academy",
    href: "/academy",
  },
};

export const marketplaceCapability: FutureCapability = {
  eyebrow: "Future ecosystem capability",
  heading: "Marketplace",
  description:
    "Connecting what is grown to the people who buy it, and growers to the " +
    "inputs they need — inside the same platform that taught and verified them.",
  badge: planned,
  dependsOn: [
    {
      title: "Producers with something to sell",
      description:
        "A marketplace is only as real as its supply. It opens once learners " +
        "are running production enterprises through the platform.",
    },
    {
      title: "Verified capability behind each seller",
      description:
        "A buyer needs to know who they are dealing with. Competency " +
        "verification is what makes a listing trustworthy rather than a claim.",
    },
  ],
  meanwhile: {
    title: "Start with the Academy",
    description:
      "The pathways are where a production enterprise begins. Everything else " +
      "here is built on what you learn and prove there.",
    action: "Open the Academy",
    href: "/academy",
  },
};

export const financeCapability: FutureCapability = {
  eyebrow: "Future ecosystem capability",
  heading: "Finance",
  description:
    "Access to funding that rests on a record of what someone can actually " +
    "do, rather than on collateral they do not have.",
  badge: planned,
  dependsOn: [
    {
      title: "A track record worth assessing",
      description:
        "Completed pathways, verified competencies and a working enterprise " +
        "are what make a learner assessable at all.",
    },
    {
      title: "Enterprises already operating",
      description:
        "Funding follows an operation that exists and is being tracked, not " +
        "an intention to start one.",
    },
  ],
  meanwhile: {
    title: "Build the record first",
    description:
      "Work through a pathway. The record you build there is what this " +
      "section will one day read from.",
    action: "Open the Academy",
    href: "/academy",
  },
};
