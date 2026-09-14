import type { HomeAction, IconItem, ImageAsset } from "@/content/pages/home";

export type PlatformModule = IconItem & {
  label: string;
  badge: string;
  supports: string[];
};

/** A "Who We Serve" audience, led by a photograph rather than an icon. */
export type AudienceCard = IconItem & { image: ImageAsset };

export type PlatformPageContent = {
  hero: { eyebrow: string; heading: string; description: string; image: ImageAsset; primaryAction: HomeAction; secondaryAction: HomeAction };
  capabilityMap: { eyebrow: string; heading: string; items: IconItem[] };
  journey: { eyebrow: string; heading: string; description: string; action: HomeAction; steps: IconItem[] };
  architecture: { eyebrow: string; heading: string; description: string; image: ImageAsset; supportingLine: string; modules: PlatformModule[] };
  useCases: { eyebrow: string; heading: string; items: AudienceCard[] };
  physicalBridge: { eyebrow: string; heading: string; description: string; image: ImageAsset; flow: string[] };
  cta: { eyebrow: string; heading: string; description: string; primaryAction: HomeAction; secondaryAction: HomeAction };
};

export const platformPageContent: PlatformPageContent = {
  hero: {
    eyebrow: "Our Platform",
    heading: "One Platform. Complete Ecosystem.",
    description: "FARMCLUB OS brings every part of the agri-entrepreneur journey together — learning, enterprise development, innovation, financing and market access — on one seamless digital platform.",
    image: { src: "/images/platform/platform-hero-digital-operations.png", alt: "Agricultural professionals using digital tools to coordinate operations." },
    primaryAction: { label: "Explore the Platform", href: "#modules" },
    secondaryAction: { label: "See How It Works", href: "#how-it-works" },
  },
  capabilityMap: {
    eyebrow: "A complete ecosystem",
    heading: "Learn. Build. Innovate. Connect. Grow.",
    items: [
      { title: "Learn", description: "Access courses, training and expert resources leading to skills in greenhouse farming, hydroponics and aquaculture.", icon: "learn" },
      { title: "Build", description: "Develop skills necessary and business tools, mentorship and guidance. Build entrepreneurial capacity.", icon: "build" },
      { title: "Innovate", description: "Work with groups to create and test solutions, using technology and research support. FARMCLUB will promote unique and innovative ideas through the Experience & Innovation Labs.", icon: "research" },
      { title: "Market", description: "Connect to buyers, suppliers, service providers, and new market opportunities within the value-chain.", icon: "market" },
      { title: "Finance", description: "Through integration with CBN licensed financial services providers, stakeholders can access finance, grants and investment opportunities.", icon: "finance" },
      { title: "Connect", description: "Join a community of learners, entrepreneurs, institutions and partners. Explore the world of FARMCLUB OS.", icon: "connect" },
    ],
  },
  journey: {
    eyebrow: "How it works",
    heading: "Your Platform. Your Journey.",
    description: "FARMCLUB OS is designed to guide you from where you are to where you want to be. Six simple steps. Endless possibilities.",
    action: { label: "Start Your Journey", href: "/contact" },
    steps: [
      { title: "Join", description: "Create your profile and tell us about your goals.", icon: "join" },
      { title: "Learn", description: "Select your learning preferences. Explore the tools and training programs available.", icon: "book" },
      { title: "Build", description: "Develop your skills and build capacity. Explore the different options in protected space farming, and how technology makes a difference.", icon: "build" },
      { title: "Connect", description: "Join networks and connect with experts and partners.", icon: "connect" },
      { title: "Market", description: "Connect to markets, buyers and expand your reach.", icon: "market" },
      { title: "Grow", description: "Receive mentorship, business support and resources.", icon: "grow" },
    ],
  },
  architecture: {
    eyebrow: "Platform modules",
    heading: "Everything You Need. All in One Place.",
    description: "Learning & Development, Enterprise Tools, Innovation & Research, Finance & Markets, Community & Network, Impact & Analytics all work together in one platform ecosystem.",
    image: {
      src: "/images/platform/platform-ecosystem-infographic.png",
      alt: "FARMCLUB OS ecosystem connecting education partners, learners, mentors, farms, innovation hubs and development partners through the digital platform: the Academy, Connect, Entrepreneur and Impact modules at the centre, the Learn-Experience-Intern-Enterprise-Market-Impact journey, and the outcomes the ecosystem creates.",
    },
    supportingLine: "One connected platform from learning to enterprise growth.",
    modules: [
      { label: "Learn", title: "Learning & Development", description: "Interactive courses, live training and practical resources.", badge: "01", icon: "learn", supports: ["Courses", "Training", "Expert knowledge"] },
      { label: "Build", title: "Enterprise Tools", description: "Business planning, mentorship and enterprise support.", badge: "02", icon: "enterprise", supports: ["Business tools", "Mentorship", "Enterprise support"] },
      { label: "Innovate", title: "Innovation & Research", description: "Ideas, prototypes, research and agricultural technology.", badge: "03", icon: "research", supports: ["Research", "Prototypes", "Technology"] },
      { label: "Finance", title: "Finance & Markets", description: "Finance pathways, buyers, suppliers and market opportunities.", badge: "04", icon: "finance", supports: ["Finance readiness", "Buyers", "Markets"] },
      { label: "Connect", title: "Community & Network", description: "Entrepreneurs, experts, partners and institutions in one ecosystem.", badge: "05", icon: "connect", supports: ["Community", "Experts", "Partners"] },
      { label: "Impact", title: "Impact & Analytics", description: "Tools for understanding progress, outcomes and contribution.", badge: "06", icon: "impact", supports: ["Progress", "Outcomes", "Insight"] },
    ],
  },
  useCases: {
    eyebrow: "Built for every agri-entrepreneur",
    heading: "Who We Serve",
    items: [
      { title: "Aspiring Entrepreneurs", description: "Learn, get inspired and start your journey.", icon: "join", image: { src: "/images/platform/who-we-serve/serve-1.webp", alt: "A secondary school student smiling at her desk during a lesson." } },
      { title: "Growing Businesses", description: "Access tools and support to scale and grow.", icon: "grow", image: { src: "/images/platform/who-we-serve/serve-2.webp", alt: "A woman entrepreneur inspecting leafy greens she has grown in a managed-space greenhouse." } },
      { title: "Innovators & Researchers", description: "Turn ideas into solutions with our innovation labs.", icon: "research", image: { src: "/images/platform/who-we-serve/serve-3.webp", alt: "A producer standing between rows of greenhouse crops in a managed-space growing facility." } },
      { title: "Market Actors", description: "Buyers, suppliers and service providers in the ecosystem.", icon: "market", image: { src: "/images/platform/who-we-serve/serve-4.webp", alt: "An agri-enterprise operator reviewing stock on a tablet in a packaging and distribution warehouse." } },
      { title: "Community & Network Groups", description: "Learn, share and build stronger agricultural communities.", icon: "community", image: { src: "/images/platform/who-we-serve/serve-5.webp", alt: "A professional working on a laptop in a shared workspace alongside colleagues." } },
      { title: "Partners & Institutions", description: "Collaborate with us to create impact at scale.", icon: "handshake", image: { src: "/images/platform/who-we-serve/serve-6.webp", alt: "Two partners discussing an agreement together over a laptop in a meeting room." } },
    ],
  },
  physicalBridge: {
    eyebrow: "Experience & Innovation Hub",
    heading: "Digital learning connected to practical experience.",
    description: "The Hub is the physical heart of FARMCLUB OS — a living environment for learning, testing, creating and scaling agricultural solutions.",
    image: { src: "/images/hubs/hubs-hero-innovation-greenhouse.png", alt: "Agricultural technology and practical learning in a greenhouse environment." },
    flow: ["Learn", "Innovate", "Build", "Connect"],
  },
  cta: {
    eyebrow: "All the tools. All the connections. All the support.",
    heading: "One Platform.",
    description: "Join the community of agri-entrepreneurs building a sustainable future.",
    primaryAction: { label: "Join FARMCLUB OS", href: "/contact" },
    secondaryAction: { label: "Explore the Hub", href: "/hubs" },
  },
};
