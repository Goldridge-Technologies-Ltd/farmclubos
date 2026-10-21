import {
  appNavigation,
  canAdministerPlatform,
  canAuthorContent,
  canManageInstitution,
  contentNavigation,
  isActiveNavItem,
  manageNavigation,
  plannedNavigation,
  platformNavigation,
} from "./navigation";
import type { SessionContext } from "./api/contracts";

/*
  One array drives the sidebar, the mobile drawer and the breadcrumb trail, so
  a wrong active rule is wrong in three places at once — and "active" is the
  only thing on the screen telling someone where they are.
*/
describe("isActiveNavItem", () => {
  it("marks a section active from anywhere inside it", () => {
    expect(isActiveNavItem("/academy", "/academy")).toBe(true);
    expect(isActiveNavItem("/academy", "/academy/greenhouse-enterprise")).toBe(true);
  });

  it("does not match a section whose name merely starts the same", () => {
    // Without the boundary check, /academy would light up on /academy-archive.
    expect(isActiveNavItem("/academy", "/academy-archive")).toBe(false);
  });

  it("matches home exactly, or every route would be home", () => {
    expect(isActiveNavItem("/", "/")).toBe(true);
    expect(isActiveNavItem("/", "/academy")).toBe(false);
  });

  it("ignores a trailing slash, which a link or the browser may add", () => {
    expect(isActiveNavItem("/academy", "/academy/")).toBe(true);
    expect(isActiveNavItem("/", "/")).toBe(true);
  });
});

describe("appNavigation", () => {
  it("gives every item a unique href, so two cannot look active at once", () => {
    const hrefs = appNavigation.map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("starts every href at the root, because they drive Link and the matcher", () => {
    for (const item of appNavigation) {
      expect(item.href.startsWith("/")).toBe(true);
    }
  });
});

/*
  Who is shown the institution's management screens. The API checks every
  request properly; this only decides whether the links appear. Getting it
  wrong either way is visible — a learner offered screens that 404, or an
  administrator with no way in to enrol anyone.
*/
describe("canManageInstitution", () => {
  const session = (overrides: Partial<SessionContext> = {}): SessionContext => ({
    user: {
      id: "user-1",
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Obi",
      platformRole: "NONE",
    },
    activeInstitutionId: "institution-1",
    institutionRole: "LEARNER",
    memberships: [],
    ...overrides,
  });

  it("is true for an institution administrator", () => {
    expect(canManageInstitution(session({ institutionRole: "INSTITUTION_ADMIN" }))).toBe(true);
  });

  it.each(["LEARNER", "FACILITATOR", "MENTOR"] as const)("is false for a %s", (role) => {
    expect(canManageInstitution(session({ institutionRole: role }))).toBe(false);
  });

  it("is true for a platform admin working inside an institution", () => {
    expect(
      canManageInstitution(
        session({
          institutionRole: "LEARNER",
          user: { ...session().user, platformRole: "PLATFORM_ADMIN" },
        }),
      ),
    ).toBe(true);
  });

  it("is false with no active institution, whatever the role — there is nothing to manage", () => {
    expect(
      canManageInstitution(
        session({
          activeInstitutionId: null,
          institutionRole: null,
          user: { ...session().user, platformRole: "PLATFORM_ADMIN" },
        }),
      ),
    ).toBe(false);
  });
});

describe("manageNavigation", () => {
  it("never shares an href with the main navigation", () => {
    const main = new Set(appNavigation.map((item) => item.href));

    for (const item of manageNavigation) {
      expect(main.has(item.href)).toBe(false);
    }
  });
});

/*
  The platform section runs every institution, so it follows the platform
  role alone — unlike Manage, it needs no active institution: a platform
  administrator who belongs to none is exactly who sets the first one up.
*/
describe("canAdministerPlatform", () => {
  const user = {
    id: "user-1",
    email: "ops@example.com",
    firstName: "Ops",
    lastName: "Admin",
    platformRole: "PLATFORM_ADMIN" as const,
  };

  it("is true for a platform administrator with no institution at all", () => {
    expect(
      canAdministerPlatform({
        user,
        activeInstitutionId: null,
        institutionRole: null,
        memberships: [],
      }),
    ).toBe(true);
  });

  it.each(["CONTENT_MANAGER", "NONE"] as const)("is false for platform role %s", (platformRole) => {
    expect(
      canAdministerPlatform({
        user: { ...user, platformRole },
        activeInstitutionId: "institution-1",
        institutionRole: "INSTITUTION_ADMIN",
        memberships: [],
      }),
    ).toBe(false);
  });
});

describe("platformNavigation", () => {
  it("shares no href with any other group", () => {
    const others = new Set([...appNavigation, ...manageNavigation].map((item) => item.href));

    for (const item of platformNavigation) {
      expect(others.has(item.href)).toBe(false);
    }
  });
});

/*
  The Academy belongs to no institution, so the content team is picked out by
  platform role alone: administrators and content managers, whatever
  institution — if any — they are working in.
*/
describe("canAuthorContent", () => {
  const session = (platformRole: "PLATFORM_ADMIN" | "CONTENT_MANAGER" | "NONE") => ({
    user: {
      id: "user-1",
      email: "writer@example.com",
      firstName: "Wren",
      lastName: "Writer",
      platformRole,
    },
    activeInstitutionId: null,
    institutionRole: null,
    memberships: [],
  });

  it.each(["PLATFORM_ADMIN", "CONTENT_MANAGER"] as const)("is true for %s", (role) => {
    expect(canAuthorContent(session(role))).toBe(true);
  });

  it("is false for everyone else, an institution administrator included", () => {
    expect(
      canAuthorContent({
        ...session("NONE"),
        activeInstitutionId: "institution-1",
        institutionRole: "INSTITUTION_ADMIN",
      }),
    ).toBe(false);
  });
});

describe("contentNavigation", () => {
  it("shares no href with any other group", () => {
    const others = new Set(
      [...appNavigation, ...manageNavigation, ...platformNavigation].map((item) => item.href),
    );

    for (const item of contentNavigation) {
      expect(others.has(item.href)).toBe(false);
    }
  });
});

/*
  What is not built yet sits under its own heading, so a planned section must
  never also appear among the working ones, where it would pass for a service.
*/
describe("plannedNavigation", () => {
  it("shares no href with any other group", () => {
    const others = new Set(
      [...appNavigation, ...manageNavigation, ...platformNavigation, ...contentNavigation].map(
        (item) => item.href,
      ),
    );

    for (const item of plannedNavigation) {
      expect(others.has(item.href)).toBe(false);
    }
  });
});
