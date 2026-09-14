import type { HomeAction, IconItem, ImageAsset } from "@/content/pages/home";

export type LearningPath = IconItem & {
  badge: string;
  topics: string[];
};

export type KnowledgePageContent = {
  hero: { eyebrow: string; heading: string; description: string; image: ImageAsset };
  categories: { eyebrow: string; heading: string; items: IconItem[] };
  libraryState: { eyebrow: string; heading: string; description: string; note: string };
  pathways: { eyebrow: string; heading: string; description: string; action: HomeAction; items: LearningPath[] };
  cta: { eyebrow: string; heading: string; description: string; primaryAction: HomeAction; secondaryAction: HomeAction };
};

export const knowledgePageContent: KnowledgePageContent = {
  hero: {
    eyebrow: "Knowledge Centre",
    heading: "Knowledge. For Growth. For Impact.",
    description: "Your gateway to expert insights, practical tools, training resources and real-world stories that power agri-entrepreneurs and agribusinesses.",
    image: { src: "/images/knowledge/knowledge-centre-hero-learning-lab.png", alt: "Participants using digital tools during an agricultural learning session." },
  },
  categories: {
    eyebrow: "Explore",
    heading: "Knowledge for every stage of the journey.",
    items: [
      { title: "Articles & Insights", description: "Practical knowledge on agribusiness, innovation and entrepreneurship.", icon: "book" },
      { title: "Guides & Toolkits", description: "Step-by-step resources to help you start, grow and scale.", icon: "learn" },
      { title: "Videos & Webinars", description: "Learn from experts through live sessions and on-demand videos.", icon: "video" },
      { title: "Research & Reports", description: "Data, trends and research to inform smart decisions.", icon: "report" },
      { title: "Success Stories", description: "Real stories from agri-entrepreneurs making an impact.", icon: "community" },
      { title: "Innovation Lab", description: "Ideas, experiments and solutions shaping the future of agriculture.", icon: "research" },
    ],
  },
  libraryState: {
    eyebrow: "Latest knowledge",
    heading: "Knowledge for Your Journey",
    description: "The Knowledge Centre brings together practical learning across production, enterprise, innovation and growth.",
    note: "Published articles, guides, videos and reports are being prepared for release. Follow the collections above to see what each area will cover.",
  },
  pathways: {
    eyebrow: "Learning paths",
    heading: "Grow Your Skills. Build Your Future.",
    description: "Follow curated learning paths designed to help you gain the right knowledge at every stage of your journey.",
    action: { label: "Explore Learning Paths", href: "/contact" },
    items: [
      {
        title: "Start & Learn",
        description: "Agribusiness basics and the first steps in your entrepreneurial journey.",
        badge: "01",
        icon: "build",
        topics: ["Introduction to Agribusiness", "Understanding the Basics", "Planning Your Journey"],
      },
      {
        title: "Build & Grow",
        description: "Farm operations, business management and market development.",
        badge: "02",
        icon: "grow",
        topics: ["Production & Operations", "Business Management", "Marketing & Sales"],
      },
      {
        title: "Scale & Succeed",
        description: "Finance, enterprise growth and strategic partnerships.",
        badge: "03",
        icon: "impact",
        topics: ["Financing & Investment", "Scaling Your Business", "Building Partnerships"],
      },
      {
        title: "Innovate & Lead",
        description: "Innovation, technology, sustainability and leadership.",
        badge: "04",
        icon: "rocket",
        topics: ["Innovation & Technology", "Sustainability Practices", "Leadership & Impact"],
      },
    ],
  },
  cta: {
    eyebrow: "Learn. Share. Grow Together.",
    heading: "Join a community building the future of food.",
    description: "Connect with agri-entrepreneurs, experts and innovators across the FARMCLUB OS ecosystem.",
    primaryAction: { label: "Join the Community", href: "/contact" },
    secondaryAction: { label: "Explore the Platform", href: "/platform" },
  },
};
