import { appNavigation, isActiveNavItem } from "./navigation";

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
