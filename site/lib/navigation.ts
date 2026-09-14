export type NavigationItem = {
  label: string;
  href: string;
};

export const siteNavigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Platform", href: "/platform" },
  { label: "Hubs", href: "/hubs" },
  { label: "Knowledge Centre", href: "/knowledge-centre" },
  { label: "Investors", href: "/investors" },
  { label: "Contact", href: "/contact" },
];

export const primaryNavigationAction: NavigationItem = {
  label: "Partner With Us",
  href: "/contact",
};
