/*
  Seeds the Academy catalogue: the three flagship pathways of the Phase 1 MVP
  and their module sequences, exactly as the MVP plan states them.

  CONTENT GUARDRAIL (AGENTS.md, docs/design-system.md §13). In the web app,
  figures may appear only when they come from real platform data. Nothing here
  may be mistaken for one, so this seed:
    - leaves estimatedHours, durationMinutes and capacity NULL everywhere;
    - creates no Institution, no ExperienceSite, no Cohort and no Enrolment —
      that is how a named hub location or an invented adoption figure would
      otherwise creep in;
    - writes no progress, attempt or credential rows.

  What it does create is structure that is real and already agreed: three
  pathways, their modules in order, one placeholder lesson per module and one
  assessment shell per module. Lessons and assessments stay
  `authoringStatus: PLACEHOLDER` until someone writes them — the one exception
  is noted below.

  It is idempotent: every row is upserted by its natural key, so running it
  again updates rather than duplicates.
*/
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

type ModuleSeed = {
  slug: string;
  title: string;
  summary: string;
};

type PathwaySeed = {
  slug: string;
  title: string;
  summary: string;
  level: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
  audience: string;
  modules: ModuleSeed[];
};

const PATHWAYS: PathwaySeed[] = [
  {
    slug: "agricultural-entrepreneurship-foundation",
    title: "Agricultural Entrepreneurship Foundation",
    summary:
      "For school and university learners and aspiring entrepreneurs: from the fundamentals of agriculture through to building a viable enterprise.",
    level: "FOUNDATION",
    audience: "Explorer",
    modules: [
      {
        slug: "fundamentals-of-agriculture",
        title: "Fundamentals of Agriculture",
        summary: "How modern agricultural production works, and where the opportunities sit.",
      },
      {
        slug: "entrepreneurship",
        title: "Entrepreneurship",
        summary: "Turning an agricultural opportunity into an enterprise idea worth testing.",
      },
      {
        slug: "business-models",
        title: "Business Models",
        summary: "How an agri-enterprise creates, delivers and captures value.",
      },
      {
        slug: "financial-literacy",
        title: "Financial Literacy",
        summary: "Costs, pricing, margins and the records a viable enterprise keeps.",
      },
      {
        slug: "markets",
        title: "Markets",
        summary: "Understanding demand, buyers and routes to market.",
      },
      {
        slug: "sustainability",
        title: "Sustainability",
        summary: "Producing in a way that the land, the market and the business can sustain.",
      },
      {
        slug: "digital-agriculture",
        title: "Digital Agriculture",
        summary: "The tools and data that make managed-space production measurable.",
      },
    ],
  },
  {
    slug: "greenhouse-enterprise",
    title: "Greenhouse Enterprise",
    summary:
      "Technology-enabled, managed-space food production, taught where theory can meet practice: from production planning through to an enterprise project.",
    level: "INTERMEDIATE",
    audience: "Emerging Entrepreneur",
    modules: [
      {
        slug: "production-planning",
        title: "Production Planning",
        summary: "Planning a growing cycle around demand, capacity and season.",
      },
      {
        slug: "greenhouse-operations",
        title: "Greenhouse Operations",
        summary: "Running a managed-space system day to day.",
      },
      {
        slug: "crop-economics",
        title: "Crop Economics",
        summary: "What a crop costs to grow, and what it has to earn.",
      },
      {
        slug: "records",
        title: "Records",
        summary: "The production and financial records that make performance visible.",
      },
      {
        slug: "post-harvest",
        title: "Post-Harvest",
        summary: "Handling, storage and quality after the crop leaves the house.",
      },
      {
        slug: "market-planning",
        title: "Market Planning",
        summary: "Matching what is grown to buyers who will take it.",
      },
      {
        slug: "enterprise-project",
        title: "Enterprise Project",
        summary: "Bringing the pathway together into a plan for a real production enterprise.",
      },
    ],
  },
  {
    slug: "agribusiness-enterprise-accelerator",
    title: "Agribusiness Enterprise Accelerator",
    summary:
      "For participants who already have an idea or a business: diagnosing where the enterprise stands and building the plan to grow it.",
    level: "ADVANCED",
    audience: "Existing Enterprise",
    modules: [
      {
        slug: "business-diagnosis",
        title: "Business Diagnosis",
        summary: "An honest assessment of where the enterprise stands today.",
      },
      {
        slug: "costing",
        title: "Costing",
        summary: "Knowing the true cost of what the enterprise produces.",
      },
      {
        slug: "records",
        title: "Records",
        summary: "Record-keeping that supports decisions and stands up to scrutiny.",
      },
      {
        slug: "product-value-proposition",
        title: "Product & Value Proposition",
        summary: "Sharpening what the enterprise sells and why a buyer chooses it.",
      },
      {
        slug: "market-access",
        title: "Market Access",
        summary: "Reaching reliable demand and holding on to it.",
      },
      {
        slug: "financial-readiness",
        title: "Financial Readiness",
        summary: "Getting the enterprise ready for investment or credit.",
      },
      {
        slug: "growth-plan",
        title: "Growth Plan",
        summary: "A costed plan for the next stage of the business.",
      },
    ],
  },
];

/*
  The single authored assessment. The milestone needs one walkable
  "take an assessment → progress recorded" journey, so the first module of the
  first pathway carries a real four-question quiz. It is marked PLACEHOLDER so
  the UI still labels it as provisional, and it is the only authored content in
  this seed — every other assessment is an empty shell.
*/
const STARTER_QUIZ = {
  pathwaySlug: "agricultural-entrepreneurship-foundation",
  moduleSlug: "fundamentals-of-agriculture",
  questions: [
    {
      prompt:
        "What distinguishes managed-space food production from open-field farming?",
      type: "SINGLE_CHOICE" as const,
      options: [
        { label: "The growing environment is controlled rather than left to the weather.", isCorrect: true },
        { label: "It can only be used for cereal crops.", isCorrect: false },
        { label: "It requires no planning before a growing cycle begins.", isCorrect: false },
        { label: "It removes the need to find buyers for the harvest.", isCorrect: false },
      ],
    },
    {
      prompt: "Why does an agricultural enterprise keep production records?",
      type: "MULTIPLE_CHOICE" as const,
      options: [
        { label: "To know what a crop actually cost to produce.", isCorrect: true },
        { label: "To compare one growing cycle against the next.", isCorrect: true },
        { label: "To support an application for credit or investment.", isCorrect: true },
        { label: "To satisfy a legal requirement to publish yields.", isCorrect: false },
      ],
    },
    {
      prompt:
        "A viable food enterprise needs a route to reliable demand before it plans production.",
      type: "TRUE_FALSE" as const,
      options: [
        { label: "True", isCorrect: true },
        { label: "False", isCorrect: false },
      ],
    },
    {
      prompt:
        "In your own words, name one agricultural opportunity you have seen near you, and who would buy from it.",
      type: "SHORT_ANSWER" as const,
      options: [],
    },
  ],
};

function connection(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "Set DATABASE_URL in api/.env before seeding — see docs/guides/local-dev.md.",
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

async function main(): Promise<void> {
  const prisma = connection();

  try {
    for (const [pathwayIndex, seed] of PATHWAYS.entries()) {
      const pathway = await prisma.pathway.upsert({
        where: { slug: seed.slug },
        create: {
          slug: seed.slug,
          title: seed.title,
          summary: seed.summary,
          description: `Phase 1 flagship pathway. Designed for the ${seed.audience} user state.`,
          level: seed.level,
          status: "PUBLISHED",
          sequence: pathwayIndex + 1,
          // estimatedHours stays null: see the guardrail note above.
        },
        update: {
          title: seed.title,
          summary: seed.summary,
          level: seed.level,
          status: "PUBLISHED",
          sequence: pathwayIndex + 1,
        },
      });

      for (const [moduleIndex, moduleSeed] of seed.modules.entries()) {
        const pathwayModule = await prisma.pathwayModule.upsert({
          where: {
            pathwayId_slug: { pathwayId: pathway.id, slug: moduleSeed.slug },
          },
          create: {
            pathwayId: pathway.id,
            slug: moduleSeed.slug,
            title: moduleSeed.title,
            summary: moduleSeed.summary,
            sequence: moduleIndex + 1,
            status: "PUBLISHED",
          },
          update: {
            title: moduleSeed.title,
            summary: moduleSeed.summary,
            sequence: moduleIndex + 1,
            status: "PUBLISHED",
          },
        });

        // One lesson per module, an outline awaiting authoring. `body` stays
        // null, which is what the UI reads to show the authoring notice.
        await prisma.lesson.upsert({
          where: {
            moduleId_slug: { moduleId: pathwayModule.id, slug: "introduction" },
          },
          create: {
            moduleId: pathwayModule.id,
            slug: "introduction",
            title: moduleSeed.title,
            summary: moduleSeed.summary,
            kind: "TEXT",
            authoringStatus: "PLACEHOLDER",
            sequence: 1,
            status: "PUBLISHED",
          },
          update: {
            title: moduleSeed.title,
            summary: moduleSeed.summary,
            status: "PUBLISHED",
          },
        });

        const isStarterQuiz =
          seed.slug === STARTER_QUIZ.pathwaySlug &&
          moduleSeed.slug === STARTER_QUIZ.moduleSlug;

        const assessment = await prisma.assessment.upsert({
          where: {
            moduleId_slug: {
              moduleId: pathwayModule.id,
              slug: "module-check",
            },
          },
          create: {
            moduleId: pathwayModule.id,
            slug: "module-check",
            title: `${moduleSeed.title}: module check`,
            instructions: isStarterQuiz
              ? "Answer every question. You can retake this check as often as you need."
              : null,
            kind: "QUIZ",
            authoringStatus: "PLACEHOLDER",
            status: isStarterQuiz ? "PUBLISHED" : "DRAFT",
          },
          update: {
            title: `${moduleSeed.title}: module check`,
            status: isStarterQuiz ? "PUBLISHED" : "DRAFT",
          },
        });

        if (isStarterQuiz) {
          await seedQuestions(prisma, assessment.id);
        }
      }
    }

    const [pathways, modules, lessons, assessments, questions] =
      await Promise.all([
        prisma.pathway.count(),
        prisma.pathwayModule.count(),
        prisma.lesson.count(),
        prisma.assessment.count(),
        prisma.assessmentQuestion.count(),
      ]);

    console.log(
      `Seeded ${pathways} pathways, ${modules} modules, ${lessons} lessons, ` +
        `${assessments} assessments, ${questions} questions.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

/** Replaces the starter quiz's questions so re-running never duplicates them. */
async function seedQuestions(
  prisma: PrismaClient,
  assessmentId: string,
): Promise<void> {
  await prisma.assessmentQuestion.deleteMany({ where: { assessmentId } });

  for (const [index, question] of STARTER_QUIZ.questions.entries()) {
    await prisma.assessmentQuestion.create({
      data: {
        assessmentId,
        prompt: question.prompt,
        type: question.type,
        sequence: index + 1,
        options: {
          create: question.options.map((option, optionIndex) => ({
            label: option.label,
            isCorrect: option.isCorrect,
            sequence: optionIndex + 1,
          })),
        },
      },
    });
  }
}

await main();
