import { NodeEnv, validate } from "./env.validation.js";

describe("validate", () => {
  it("applies defaults when nothing is set", () => {
    const config = validate({});

    expect(config.NODE_ENV).toBe(NodeEnv.Development);
    expect(config.PORT).toBe(3002);
    expect(config.API_GLOBAL_PREFIX).toBe("api");
  });

  it("coerces PORT from the string the environment always provides", () => {
    const config = validate({ PORT: "4000" });

    expect(config.PORT).toBe(4000);
  });

  it("rejects a NODE_ENV outside the known set", () => {
    expect(() => validate({ NODE_ENV: "staging" })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it("rejects a PORT outside the valid range", () => {
    expect(() => validate({ PORT: "70000" })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it("keeps a value that is supplied", () => {
    const config = validate({
      NODE_ENV: "production",
      CORS_ORIGINS: "https://app.farmclubos.com",
    });

    expect(config.NODE_ENV).toBe(NodeEnv.Production);
    expect(config.CORS_ORIGINS).toBe("https://app.farmclubos.com");
  });
});
