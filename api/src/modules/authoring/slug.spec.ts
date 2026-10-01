import { slugFor } from "./slug.js";

/*
  A slug is in every learner's address bar and bookmarks: it must be readable,
  stable, and never collide with a sibling's.
*/
describe("slugFor", () => {
  it("makes a readable address from a title", () => {
    expect(slugFor("Enterprise Mindset", "module", new Set())).toBe("enterprise-mindset");
  });

  it("drops accents and punctuation, and runs of either", () => {
    expect(slugFor("Café — Production & Markets!", "module", new Set())).toBe(
      "cafe-production-markets",
    );
  });

  it("numbers a title a sibling already uses", () => {
    const taken = new Set(["enterprise-mindset", "enterprise-mindset-2"]);

    expect(slugFor("Enterprise Mindset", "module", taken)).toBe("enterprise-mindset-3");
  });

  it("falls back to the kind of thing when a title has no letters or digits", () => {
    expect(slugFor("— ✦ —", "lesson", new Set())).toBe("lesson");
    expect(slugFor("— ✦ —", "lesson", new Set(["lesson"]))).toBe("lesson-2");
  });

  it("keeps a long title's slug to a sensible length, without a trailing dash", () => {
    const slug = slugFor(`${"word ".repeat(40)}end`, "lesson", new Set());

    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});
