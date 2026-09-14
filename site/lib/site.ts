import type { IconName } from "@/components/ui/Icon";

/*
  Shared organisation details used by the footer and the contact page.
  The contact values are taken from the approved design references in
  /public/references. Update them here and every surface follows.
*/

export const siteContact = {
  email: "hello@farmclubos.com",
  phone: "+234 706 823 7616",
  phoneHref: "+2347068237616",
  location: "Lagos State, Nigeria",
  officeHours: ["Monday – Friday: 9:00 AM – 5:00 PM", "Saturday – Sunday: Closed"],
} as const;

export type SocialLink = {
  label: string;
  icon: IconName;
  /**
   * Public profile URL. Left empty until an account is confirmed — links with
   * no URL are not rendered, so the site never ships a dead social link.
   */
  url: string;
};

export const socialLinks: SocialLink[] = [
  { label: "LinkedIn", icon: "linkedin", url: "" },
  { label: "X", icon: "x", url: "" },
  { label: "Facebook", icon: "facebook", url: "" },
  { label: "Instagram", icon: "instagram", url: "" },
  { label: "YouTube", icon: "youtube", url: "" },
];

export const activeSocialLinks = socialLinks.filter((link) => link.url !== "");

export type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

/*
  Every destination below resolves to a real route or in-page section, so the
  footer contains no dead links.
*/
export const footerColumns: FooterColumn[] = [
  {
    title: "Platform",
    links: [
      { label: "Overview", href: "/platform" },
      { label: "How It Works", href: "/platform#how-it-works" },
      { label: "Modules", href: "/platform#modules" },
      { label: "Who We Serve", href: "/platform#who-we-serve" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Knowledge Centre", href: "/knowledge-centre" },
      { label: "Guides & Toolkits", href: "/knowledge-centre#collections" },
      { label: "Research & Reports", href: "/knowledge-centre#collections" },
      { label: "Learning Paths", href: "/knowledge-centre#learning-paths" },
    ],
  },
  {
    title: "Programmes",
    links: [
      { label: "Experience & Innovation Hub", href: "/hubs" },
      { label: "Hub Capabilities", href: "/hubs#capabilities" },
      { label: "Enterprise Support", href: "/platform#modules" },
      { label: "Innovation Lab", href: "/knowledge-centre#collections" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Our Commitment", href: "/about#commitment" },
      { label: "Investors", href: "/investors" },
      { label: "Contact", href: "/contact" },
    ],
  },
];
