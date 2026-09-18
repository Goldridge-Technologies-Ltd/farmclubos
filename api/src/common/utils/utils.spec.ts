import { normalizeEmail } from "./normalize-email.js";
import { slugify } from "./slugify.js";
import { webappLink } from "./webapp-link.js";

describe("normalizeEmail", () => {
  it("trims and lower-cases", () => {
    expect(normalizeEmail("  Ada.Obi@Example.COM ")).toBe("ada.obi@example.com");
  });
});

describe("webappLink", () => {
  it("joins a base and a path with exactly one slash", () => {
    expect(webappLink("http://localhost:3001/", "/accept-invite")).toBe(
      "http://localhost:3001/accept-invite",
    );
  });

  it("keeps a path already on the base URL", () => {
    expect(webappLink("https://example.com/app", "reset-password")).toBe(
      "https://example.com/app/reset-password",
    );
  });

  it("encodes query parameters", () => {
    expect(webappLink("http://localhost:3001", "reset-password", { token: "a b&c" })).toBe(
      "http://localhost:3001/reset-password?token=a+b%26c",
    );
  });
});

describe("slugify", () => {
  it("lower-cases and hyphenates", () => {
    expect(slugify("Greenfield Technical College")).toBe("greenfield-technical-college");
  });

  it("folds accents and spells out ampersands", () => {
    expect(slugify("Université Agro & Tech")).toBe("universite-agro-and-tech");
  });

  it("collapses punctuation and trims separators", () => {
    expect(slugify("  --St. Mary's (North Campus)--  ")).toBe("st-mary-s-north-campus");
  });

  it("caps the length without leaving a trailing hyphen", () => {
    const slug = slugify("a".repeat(58) + " bcdef", 60);

    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("never returns an empty slug", () => {
    expect(slugify("!!!")).toBe("institution");
  });
});
