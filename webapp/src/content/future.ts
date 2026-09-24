/*
  The two sections of the ecosystem that are not open yet.

  Marketplace and financial services are deliberately not built before the
  layer beneath them works: a marketplace with nothing produced on it, or
  lending with no record to lend against, is a screen pretending to be a
  product. Saying that plainly is better than hiding the sections, because
  they are part of how FARMCLUB OS fits together.

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

export const marketplaceCapability: FutureCapability = {
  eyebrow: "Future ecosystem capability",
  heading: "Marketplace",
  description:
    "Connecting what is grown to the people who buy it, and growers to the " +
    "inputs they need — inside the same platform that taught and verified them.",
  badge: "Coming soon",
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
  badge: "Coming soon",
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
      "Work through a pathway and have your competencies verified. That " +
      "record is what this section will one day read from.",
    action: "Open the Academy",
    href: "/academy",
  },
};
