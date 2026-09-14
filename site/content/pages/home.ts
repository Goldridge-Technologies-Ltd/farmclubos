import type { IconName } from "@farmclub/design-system/Icon";

export type HomeAction = { label: string; href: string };
export type ImageAsset = { src: string; alt: string };
export type NamedItem = { title: string; description: string };
export type LabelledItem = NamedItem & { label?: string; badge?: string };
export type IconItem = NamedItem & { icon: IconName };

export type EcosystemNode = IconItem & {
  /** Label shown in the diagram ring. */
  label: string;
  tone: "green" | "gold";
};

export type HomePageContent = {
  hero: {
    eyebrow: string;
    heading: string;
    description: string;
    primaryAction: HomeAction;
    secondaryAction: HomeAction;
    image: ImageAsset;
    mission: { eyebrow: string; statement: string };
  };
  capabilities: { eyebrow: string; items: IconItem[] };
  ecosystem: {
    eyebrow: string;
    heading: string;
    description: string;
    bullets: string[];
    action: HomeAction;
    core: { title: string; suffix: string };
    nodes: EcosystemNode[];
  };
  journey: { eyebrow: string; heading: string; steps: IconItem[] };
  hubs: {
    eyebrow: string;
    heading: string;
    description: string;
    action: HomeAction;
    image: ImageAsset;
    imageCaption: { title: string; description: string; action: HomeAction };
    capabilities: IconItem[];
  };
  finalCta: {
    heading: string;
    description: string;
    primaryAction: HomeAction;
    secondaryAction: HomeAction;
  };
};

export const homePageContent: HomePageContent = {
  hero: {
    eyebrow: "FARMCLUB OS - The Digital Platform",
    heading: "Building the Next Generation of Technology-Enabled Food Enterprises.",
    description:
      "FARMCLUB OS connects learning, practical experience, enterprise development, and markets through one integrated platform-focused on technology-enabled managed-space food production.",
    primaryAction: { label: "Explore the Platform", href: "/platform" },
    secondaryAction: { label: "Discover the Ecosystem", href: "#ecosystem" },
    image: {
      src: "/images/home/home-hero-agritech-greenhouse.png",
      alt: "An agricultural entrepreneur using a tablet in a greenhouse.",
    },
    mission: {
      eyebrow: "Our Mission",
      statement:
        "To empower a new generation of food and agricultural entrepreneurs using an integrated learning-to-enterprise platform for technology-enabled managed-space food production.",
    },
  },
  capabilities: {
    eyebrow: "What the platform delivers",
    items: [
      {
        title: "Learning & Capacity Building",
        description: "Courses, training and practical knowledge.",
        icon: "learn",
      },
      {
        title: "Enterprise Development",
        description: "Tools, mentorship and enterprise support.",
        icon: "enterprise",
      },
      {
        title: "Innovation & Research",
        description: "Ideas, research and applied technology.",
        icon: "innovate",
      },
      {
        title: "Market Access",
        description: "Buyers, suppliers and trade pathways.",
        icon: "market",
      },
      {
        title: "Impact Intelligence",
        description: "Evidence of progress and outcomes.",
        icon: "impact",
      },
    ],
  },
  ecosystem: {
    eyebrow: "One platform. Endless possibilities.",
    heading: "Our Platform Ecosystem",
    description:
      "FARMCLUB OS brings together every part of the agri-entrepreneur journey in one seamless digital ecosystem.",
    bullets: [
      "Learn the right skills",
      "Start and grow your enterprise",
      "Access tools, finance and experts",
      "Connect to markets and opportunities",
    ],
    action: { label: "Discover the Platform", href: "/platform" },
    core: { title: "FARMCLUB", suffix: "OS" },
    nodes: [
      {
        label: "Learn",
        title: "Learn",
        description: "Courses, training and capacity building",
        icon: "learn",
        tone: "green",
      },
      {
        label: "Innovate",
        title: "Innovate",
        description: "Research, tech solutions and innovation support",
        icon: "innovate",
        tone: "gold",
      },
      {
        label: "Enterprise",
        title: "Enterprise",
        description: "Business tools, mentorship and enterprise support",
        icon: "enterprise",
        tone: "green",
      },
      {
        label: "Connect",
        title: "Connect",
        description: "Networks, partnerships and community",
        icon: "connect",
        tone: "green",
      },
      {
        label: "Market",
        title: "Market",
        description: "Market access, e-commerce and trade",
        icon: "market",
        tone: "gold",
      },
      {
        label: "Finance",
        title: "Finance",
        description: "Funding access, grants and investments",
        icon: "finance",
        tone: "green",
      },
    ],
  },
  journey: {
    eyebrow: "How it works",
    heading: "Your Journey. Our Platform.",
    steps: [
      {
        title: "Join",
        description: "Create your profile and get started",
        icon: "join",
      },
      {
        title: "Learn",
        description: "Access courses and resources",
        icon: "book",
      },
      {
        title: "Build",
        description: "Develop your skills and business",
        icon: "build",
      },
      {
        title: "Grow",
        description: "Access tools, experts and financing",
        icon: "grow",
      },
      {
        title: "Market",
        description: "Sell, trade and expand markets",
        icon: "market",
      },
      {
        title: "Impact",
        description: "Create jobs and transform communities",
        icon: "community",
      },
    ],
  },
  hubs: {
    eyebrow: "Experience. Innovate. Transform.",
    heading: "Experience & Innovation Hubs",
    description:
      "Our physical hubs bring technology, training and smart agriculture solutions closer to communities.",
    action: { label: "Explore Our Hubs", href: "/hubs" },
    image: {
      src: "/images/home/experience-innovation-hub.png",
      alt: "FARMCLUB OS Experience & Innovation Hub overview: a hydroponics and aquaponics learning lab, showing a facilitator and learners at a crop health dashboard beside the nutrient system.",
    },
    imageCaption: {
      title: "The Experience & Innovation Hub",
      description:
        "Where digital learning meets real-world agricultural innovation.",
      action: { label: "Learn More", href: "/hubs" },
    },
    capabilities: [
      {
        title: "Learn",
        description:
          "Training and capacity development in modern, technology-enabled, managed-space food production.",
        icon: "learn",
      },
      {
        title: "Innovate",
        description:
          "Test ideas, technologies and solutions in practical environments.",
        icon: "research",
      },
      {
        title: "Build",
        description:
          "Access tools, mentorship and resources to grow a sustainable enterprise.",
        icon: "build",
      },
      {
        title: "Connect",
        description:
          "Work with experts, partners and peers to create solutions and opportunities.",
        icon: "connect",
      },
    ],
  },
  finalCta: {
    heading: "Ready to transform agriculture through innovation?",
    description:
      "Join the FARMCLUB OS ecosystem or work with us to empower agricultural entrepreneurs.",
    primaryAction: { label: "Partner With Us", href: "/contact" },
    secondaryAction: { label: "Explore the Platform", href: "/platform" },
  },
};
