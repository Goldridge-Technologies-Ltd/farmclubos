import type { IconItem, ImageAsset } from "@/content/pages/home";
import type { FaqItem } from "@/components/ui/FaqList";

export type ContactPageContent = {
  hero: { eyebrow: string; heading: string; description: string; image: ImageAsset; categories: string[] };
  enquiryTypes: string[];
  pathways: { eyebrow: string; heading: string; items: IconItem[] };
  form: { privacyNote: string; integrationNote: string; requiredNote: string };
  faqs: FaqItem[];
  partnership: { heading: string; description: string };
};

export const contactPageContent: ContactPageContent = {
  hero: {
    eyebrow: "Contact Us",
    heading: "Let's Build the Future of Agriculture Together.",
    description: "Whether you are an entrepreneur, partner, investor or institution, we would love to hear from you.",
    image: { src: "/images/contact/contact-hero-partnership-meeting.png", alt: "Agricultural and institutional collaborators in a focused meeting." },
    categories: [
      "Partnership & Collaboration",
      "Platform Enquiries & Support",
      "Investment Opportunities",
      "Media & Press",
    ],
  },
  enquiryTypes: ["Partnership & Collaboration", "Platform Enquiries & Support", "Investment", "Media & Press"],
  pathways: {
    eyebrow: "How can we help?",
    heading: "Choose the closest fit.",
    items: [
      { title: "Partnership & Collaboration", description: "Work with FARMCLUB OS to empower entrepreneurs, strengthen communities and build sustainable impact.", icon: "handshake" },
      { title: "Platform Enquiries & Support", description: "Ask a question about the FARMCLUB OS platform and how it works.", icon: "support" },
      { title: "Investment", description: "Request approved investor information and connect with the team.", icon: "finance" },
      { title: "Media & Press", description: "Request approved public information, interviews or media materials.", icon: "report" },
    ],
  },
  form: {
    privacyNote: "Do not include confidential, financial, identity or other sensitive information in this interim form.",
    integrationNote: "Online delivery is not connected yet. Reviewing the form only checks that your message is complete on this device.",
    requiredNote: "Fields marked * are required.",
  },
  /*
    Answers are drawn from the About and Platform pages so the FAQ never states
    anything the rest of the site does not already say.
  */
  faqs: [
    {
      question: "What is FARMCLUB OS?",
      answer: "FARMCLUB OS is a digital platform for agricultural entrepreneurship, innovation and ecosystem transformation. It brings learning, enterprise development, innovation, finance pathways and market access together in one integrated platform.",
    },
    {
      question: "Who can join FARMCLUB OS?",
      answer: "The platform is built for aspiring agricultural entrepreneurs, existing agribusinesses, innovators and researchers, market actors, community and network groups, and partner institutions.",
    },
    {
      question: "How can my organisation partner with FARMCLUB OS?",
      answer: "Send a partnership enquiry using the form on this page, or email the team directly. Partnerships span learning and capacity building, enterprise support, innovation, market access and community programmes.",
    },
    {
      question: "How do I stay updated on FARMCLUB OS?",
      answer: "Email the team to be added to the mailing list. Newsletter delivery is not connected on the website yet, so email is the reliable route until it is.",
    },
  ],
  partnership: {
    heading: "Partnerships that Grow Impact.",
    description: "Let's collaborate to empower agri-entrepreneurs, strengthen communities and build a sustainable future.",
  },
};
