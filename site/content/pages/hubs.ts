import type { HomeAction, IconItem, ImageAsset } from "@/content/pages/home";

export type HubsPageContent = {
  hero: { eyebrow: string; heading: string; statement: string; description: string; image: ImageAsset; primaryAction: HomeAction; secondaryAction: HomeAction };
  capabilityAreas: { items: IconItem[] };
  offer: { eyebrow: string; heading: string; description: string; facilities: string[]; action: HomeAction; image: ImageAsset };
  model: { eyebrow: string; heading: string; description: string; stages: IconItem[] };
  cta: { eyebrow: string; heading: string; description: string; primaryAction: HomeAction; secondaryAction: HomeAction };
};

export const hubsPageContent: HubsPageContent = {
  hero: {
    eyebrow: "Our Hubs",
    heading: "Experience & Innovation Hub",
    statement: "Where Innovation Meets Impact.",
    description: "We systematically develop people who can understand agricultural opportunities, use technology appropriately, demonstrate practical competence and build viable enterprises.",
    image: { src: "/images/hubs/hubs-hero-innovation-greenhouse.png", alt: "People learning and collaborating around agricultural technology in a greenhouse." },
    primaryAction: { label: "Explore the Hub", href: "#capabilities" },
    secondaryAction: { label: "Book a Visit", href: "/contact" },
  },
  capabilityAreas: {
    items: [
      { title: "Learn", description: "Hands-on training, courses and capacity development in modern agriculture and entrepreneurship.", icon: "learn" },
      { title: "Innovate", description: "Test ideas, prototypes and new technologies in our innovation labs and demonstration facilities.", icon: "research" },
      { title: "Build", description: "Access tools, mentorship and resources to build and grow sustainable agri-enterprises.", icon: "build" },
      { title: "Connect", description: "Collaborate with experts, partners and peers to create solutions and unlock opportunities.", icon: "connect" },
      { title: "Impact", description: "Drive real-world impact through research, innovation and enterprise development.", icon: "impact" },
    ],
  },
  offer: {
    eyebrow: "What we offer",
    heading: "A Hub Designed for Transformation",
    description: "The Hub provides the environment, tools and expertise to turn ideas into viable solutions and thriving businesses.",
    facilities: [
      "Smart greenhouse & demonstration farm",
      "Innovation labs & prototyping space",
      "Training rooms & digital learning studio",
      "Co-working & entrepreneur support space",
      "Events, bootcamps & community programmes",
    ],
    action: { label: "Discover the Hub", href: "/contact" },
    image: { src: "/images/hubs/hubs-offer-authentic.jpg", alt: "Participants exploring practical agricultural technology inside the Experience and Innovation Hub." },
  },
  model: {
    eyebrow: "Our impact goals",
    heading: "Building Today. Transforming Tomorrow.",
    description: "The Hub advances the same capability areas established across the FARMCLUB OS platform.",
    stages: [
      { title: "Product Experience", description: "FARMCLUB OS connects digital learning, hands-on Hub experience, enterprise tools and support into one guided learning-to-enterprise journey.", icon: "platform" },
      { title: "Learning Outcomes", description: "Participants build measurable knowledge, practical production skills and entrepreneurial capability through structured learning and real-world practice.", icon: "learn" },
      { title: "Institution", description: "Schools, universities, and skills-development organizations can subscribe to our programmes and create lasting value for their learners.", icon: "enterprise" },
      { title: "Experience Network", description: "Practical agricultural experiences are delivered, connected, and verified through a distributed network of experience providers.", icon: "connect" },
      { title: "Sustainable Scale", description: "Institutional adoption creates repeatable and sustainable economics, enabling FARMCLUB to expand geographically without owning every physical asset required for delivery.", icon: "grow" },
    ],
  },
  cta: {
    eyebrow: "Be part of the innovation",
    heading: "Join the Hub community.",
    description: "Access the tools, knowledge and network to grow your agricultural enterprise and impact.",
    primaryAction: { label: "Join the Hub", href: "/contact" },
    secondaryAction: { label: "Book a Visit", href: "/contact" },
  },
};
