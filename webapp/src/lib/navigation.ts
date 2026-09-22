import type { IconName } from "@farmclub/design-system/Icon";

/*
  The app's primary navigation, in one place.

  The sidebar, the mobile drawer and the breadcrumb trail all read this array,
  so an item is added, renamed or reordered exactly once. The site does the
  same in site/lib/navigation.ts; the two are deliberately separate, because a
  marketing menu and an application menu answer to different things.
*/

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  /**
   * Shown under the label in the mobile drawer, where there is room to say
   * what a section is for.
   */
  description: string;
};

export const appNavigation: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: "platform",
    description: "Where you are, and what to do next",
  },
  {
    label: "Academy",
    href: "/academy",
    icon: "learn",
    description: "Pathways, modules and lessons",
  },
  {
    label: "My Journey",
    href: "/my-journey",
    icon: "grow",
    description: "Your progress across the programme",
  },
  {
    label: "Experience",
    href: "/experience",
    icon: "build",
    description: "Practise what you have learned on a real site",
  },
  {
    label: "Mentorship",
    href: "/mentorship",
    icon: "community",
    description: "Guidance from people who have done it",
  },
  {
    label: "Enterprise",
    href: "/enterprise",
    icon: "enterprise",
    description: "Turn a skill into a business",
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    icon: "market",
    description: "Buy inputs and sell produce",
  },
  {
    label: "Finance",
    href: "/finance",
    icon: "finance",
    description: "Funding built on a proven track record",
  },
];

/** The user menu's own links. Not in the sidebar; reached from the avatar. */
export const accountNavigation: NavItem[] = [
  {
    label: "Profile",
    href: "/settings/profile",
    icon: "user",
    description: "Your name, email and preferences",
  },
];

/**
 * Whether a nav item is the section the current path is in.
 *
 * Home matches exactly — as a prefix, "/" would light up on every route. Every
 * other item matches its own path and anything below it, but only at a
 * boundary, so "/academy" does not claim "/academy-archive".
 */
export function isActiveNavItem(href: string, pathname: string): boolean {
  const path = normalise(pathname);
  const target = normalise(href);

  if (target === "/") {
    return path === "/";
  }

  return path === target || path.startsWith(`${target}/`);
}

/** Drops a trailing slash, which a link or the browser may add. */
function normalise(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}
