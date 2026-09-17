import { normalizeEmail } from "./normalize-email.js";
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
