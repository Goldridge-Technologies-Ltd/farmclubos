import type { IconName } from "@farmclub/design-system/Icon";
import type { SessionContext } from "./api/contracts";

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

/** The sections that work today, for everyone signed in. */
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
];

/**
 * The sections of the ecosystem that are not built yet, each a page that says
 * so with a "Planned" badge. They stay in the navigation because they are part
 * of how FARMCLUB OS fits together, but under a heading of their own and
 * after everything that works: nothing that is not operational may pass for a
 * working service.
 */
export const plannedNavigation: NavItem[] = [
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

/**
 * Running an institution: who belongs to it, and the intakes they are
 * enrolled on. Shown only to someone who can manage the active institution —
 * see `canManageInstitution`.
 */
export const manageNavigation: NavItem[] = [
  {
    label: "Members",
    href: "/institution/members",
    icon: "join",
    description: "Invite people and see who has joined",
  },
  {
    label: "Cohorts",
    href: "/institution/cohorts",
    icon: "calendar",
    description: "Open an intake and enrol learners onto it",
  },
];

/**
 * Whether to offer the institution's management screens.
 *
 * Only a presentation decision: the API checks every request against the
 * database, so a wrong answer here shows a link that 404s rather than opening
 * anything. It needs an active institution, because that is what is managed.
 */
export function canManageInstitution(session: SessionContext): boolean {
  if (!session.activeInstitutionId) {
    return false;
  }

  return (
    session.institutionRole === "INSTITUTION_ADMIN" ||
    session.user.platformRole === "PLATFORM_ADMIN"
  );
}

/**
 * Running the platform itself: the institutions on it. Shown only to a
 * platform administrator — see `canAdministerPlatform`.
 */
export const platformNavigation: NavItem[] = [
  {
    label: "Institutions",
    href: "/platform/institutions",
    icon: "governance",
    description: "Add an institution and invite the person who runs it",
  },
  {
    label: "Content team",
    href: "/platform/content-team",
    icon: "handshake",
    description: "Invite the content managers who build the Academy",
  },
];

/**
 * Whether to offer the platform's own screens.
 *
 * The platform role alone decides it. Unlike `canManageInstitution` it needs
 * no active institution: a platform administrator who belongs to none is
 * exactly the person who sets the first one up. As there, it only decides
 * what is shown; the API confirms the role against the database each time.
 */
export function canAdministerPlatform(session: SessionContext): boolean {
  return session.user.platformRole === "PLATFORM_ADMIN";
}

/**
 * Building the Academy: its modules, lessons and their videos and notes.
 * Shown only to the content team — see `canAuthorContent`.
 */
export const contentNavigation: NavItem[] = [
  {
    label: "Academy content",
    href: "/content/academy",
    icon: "book",
    description: "Write lessons and upload their videos",
  },
];

/**
 * Whether to offer the Academy's authoring screens: to platform administrators
 * and content managers. The catalogue belongs to no institution, so no
 * institution role grants it. As elsewhere, this only decides what is shown;
 * the API checks the role against the database on every request.
 */
export function canAuthorContent(session: SessionContext): boolean {
  return (
    session.user.platformRole === "PLATFORM_ADMIN" ||
    session.user.platformRole === "CONTENT_MANAGER"
  );
}

/** A labelled run of links below the main navigation, for a particular role. */
export type NavGroup = { heading: string; items: NavItem[] };

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
