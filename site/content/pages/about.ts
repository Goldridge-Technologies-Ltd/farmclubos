import type { HomeAction, IconItem, ImageAsset, LabelledItem, NamedItem } from "@/content/pages/home";

export type AboutPageContent = {
  hero: { eyebrow: string; heading: string; description: string; image: ImageAsset; primaryAction: HomeAction; secondaryAction: HomeAction };
  caseForChange: { eyebrow: string; heading: string; paragraphs: string[]; organisingIdea: string; image: ImageAsset };
  purpose: { eyebrow: string; heading: string; description: string; mission: NamedItem; vision: NamedItem };
  principles: { eyebrow: string; heading: string; items: LabelledItem[] };
  positioning: { eyebrow: string; heading: string; description: string; connections: IconItem[] };
  audiences: { eyebrow: string; heading: string; groups: string[] };
  commitments: { eyebrow: string; heading: string; items: IconItem[] };
  stewardship: { eyebrow: string; heading: string; description: string };
  cta: { eyebrow: string; heading: string; description: string; primaryAction: HomeAction; secondaryAction: HomeAction };
};

export const aboutPageContent: AboutPageContent = {
  hero: {
    eyebrow: "About FARMCLUB OS",
    heading: "Building the Future of Agricultural Entrepreneurship.",
    description: "FARMCLUB OS is an all-in-one digital platform that connects learning, enterprise development, innovation and markets for a new generation of agri-entrepreneurs.",
    image: { src: "/images/about/about-header.jpg", alt: "A young agri-entrepreneur reviewing production data on a tablet inside a managed-space greenhouse." },
    primaryAction: { label: "Explore the Platform", href: "/platform" },
    secondaryAction: { label: "Partner With Us", href: "/contact" },
  },
  caseForChange: {
    eyebrow: "A technology company with a purpose",
    heading: "Access to the right tools, knowledge and markets.",
    paragraphs: [
      "FARMCLUB OS was founded to solve a real problem: access to the right tools, knowledge and markets is fragmented and hard to navigate for many aspiring entrepreneurs.",
      "We built one integrated platform that brings everything together so people can learn, build, connect and grow their agricultural enterprises.",
    ],
    organisingIdea: "We are more than a platform. We are a movement inspiring a new era of innovation and impact in agriculture.",
    image: { src: "/images/about/about-tech.jpg", alt: "An agri-entrepreneur working with the FARMCLUB OS dashboard, reviewing learner, enterprise and impact data." },
  },
  purpose: {
    eyebrow: "Who we are",
    heading: "Purpose built for agricultural enterprise.",
    description: "FARMCLUB OS brings knowledge, enterprise development, innovation and collaboration together in one digital ecosystem.",
    mission: { title: "Our Mission", description: "To empower a new generation of food and agricultural entrepreneurs and build a sustainable future for Africa through knowledge, innovation and collaboration." },
    vision: { title: "Our Vision", description: "A thriving ecosystem where agriculture drives wealth, creates jobs and strengthens communities across Africa and beyond." },
  },
  principles: {
    eyebrow: "What guides us",
    heading: "Our Values",
    items: [
      { label: "01", title: "Integrity", description: "We act responsibly and build trust through clear, credible engagement.", badge: "01" },
      { label: "02", title: "Inclusion", description: "We create pathways for people and communities to participate and grow.", badge: "02" },
      { label: "03", title: "Excellence", description: "We pursue practical quality in learning, enterprise support and innovation.", badge: "03" },
      { label: "04", title: "Impact", description: "We focus on meaningful progress for entrepreneurs and agricultural communities.", badge: "04" },
    ],
  },
  positioning: {
    eyebrow: "A technology company with a purpose",
    heading: "One integrated platform for agricultural entrepreneurship.",
    description: "FARMCLUB OS makes it easier to find knowledge, build capability, connect with support and approach opportunities.",
    connections: [
      { title: "Knowledge", description: "Practical agricultural learning.", icon: "learn" },
      { title: "Enterprise", description: "Tools, mentoring and resources for starting, growing and scaling.", icon: "enterprise" },
      { title: "Innovation", description: "Ideas, research and technology connected to real needs.", icon: "innovate" },
      { title: "Markets", description: "Connections to buyers, finance and new opportunities.", icon: "market" },
    ],
  },
  audiences: {
    eyebrow: "Who it is for",
    heading: "There is a place for you in the FARMCLUB OS ecosystem.",
    groups: ["Aspiring agricultural entrepreneurs", "Existing agribusinesses", "Young people and women", "Innovators and researchers", "Community and network groups", "Learning institutions", "Partners and development organisations", "Investors and institutions"],
  },
  commitments: {
    eyebrow: "Our commitment to change",
    heading: "Our Impact Focus",
    items: [
      { title: "Youth & Women Inclusion", description: "Creating more accessible pathways into agricultural entrepreneurship. We create practical pathways for young people and women to gain skills, build enterprises and participate meaningfully in modern, technology-enabled food production.", icon: "connect" },
      { title: "Food System Transformation", description: "Supporting knowledge and innovation for stronger food systems. By connecting knowledge, technology, managed-space production, enterprise and markets, we help build more productive, resilient and inclusive food systems.", icon: "sustainability" },
      { title: "Enterprise Growth", description: "Providing the tools, mentoring and resources to start, grow and scale. We equip emerging agribusinesses with the tools, capabilities and ecosystem support needed to progress from promising ideas to sustainable enterprises.", icon: "grow" },
      { title: "Market Access", description: "Connecting entrepreneurs to buyers, networks and new market opportunities. We strengthen connections between producers, buyers and value-chain partners, helping quality food products reach the right markets more efficiently.", icon: "market" },
      { title: "Financing Solutions", description: "Helping entrepreneurs understand and approach relevant finance pathways. We help enterprises become investment-ready and connect them with appropriate financing pathways that can support sustainable growth.", icon: "finance" },
      { title: "Stronger Together", description: "Building a collaborative ecosystem for collective action and sustainable impact. We bring farmers, entrepreneurs, schools, communities, institutions and partners into a connected ecosystem where collaboration creates greater shared value.", icon: "handshake" },
    ],
  },
  stewardship: {
    eyebrow: "Our journey",
    heading: "From Entrepreneurship Development To Community Empowerment.",
    description: "Learners develop digital skills and knowledge of technology-enabled food production, using managed-spaces. They will understand greenhouse farming technology, with special focus on horticulture, hydroponics and aquaculture. LEARN -> PRACTICE -> PROVE -> BUILD -> GROW. FARMCLUB OS connects individual learning and enterprise growth with the wider goal of strong agricultural community.",
  },
  cta: {
    eyebrow: "Connect · Empower · Grow",
    heading: "Be Part of a Movement Transforming Agriculture.",
    // heading: "Join us to Build the Next Generation of Technology-Enabled Agro-Enterprises.",
    // description: "Whether you are an entrepreneur, investor, institution or partner, there is a place for you in the FARMCLUB OS ecosystem.",
    // description: "Whether you are an entrepreneur, investor, institution or partner, there is a place for you in the FARMCLUB OS ecosystem. Join us to build the next generation of technology-enabled agro-enterprises.",
  
    // heading: "FARMCLUB OS",
    description: "Join us to Build the Next Generation of Technology-Enabled Agro-Enterprises.",
    primaryAction: { label: "Partner With Us", href: "/contact" },
    secondaryAction: { label: "Explore the Platform", href: "/platform" },
  },
};
