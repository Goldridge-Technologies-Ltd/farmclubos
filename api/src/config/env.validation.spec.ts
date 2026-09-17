import { MailDriver, NodeEnv, validate } from "./env.validation.js";

/** The variables with no safe default: everything else may be omitted. */
const required = {
  DATABASE_URL: "postgresql://user:pw@localhost:5432/farmclub",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
};

describe("validate", () => {
  it("applies defaults when only the required variables are set", () => {
    const config = validate(required);

    expect(config.NODE_ENV).toBe(NodeEnv.Development);
    expect(config.PORT).toBe(4000);
    expect(config.API_GLOBAL_PREFIX).toBe("api");
    expect(config.DATABASE_POOL_MAX).toBe(10);
  });

  it("coerces PORT from the string the environment always provides", () => {
    const config = validate({ ...required, PORT: "5005" });

    expect(config.PORT).toBe(5005);
  });

  it("rejects a NODE_ENV outside the known set", () => {
    expect(() => validate({ ...required, NODE_ENV: "staging" })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it("rejects a PORT outside the valid range", () => {
    expect(() => validate({ ...required, PORT: "70000" })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it("refuses to boot without a database connection", () => {
    expect(() => validate({})).toThrow(/Invalid environment configuration/);
  });

  it("treats DIRECT_URL as optional, since it often equals DATABASE_URL", () => {
    const config = validate(required);

    expect(config.DIRECT_URL).toBeUndefined();
  });

  describe("auth", () => {
    it("applies token lifetimes suited to a short access token and a long session", () => {
      const config = validate(required);

      expect(config.ACCESS_TOKEN_TTL_SECONDS).toBe(900);
      expect(config.REFRESH_TOKEN_TTL_DAYS).toBe(30);
      expect(config.REFRESH_REUSE_GRACE_SECONDS).toBe(30);
      expect(config.PASSWORD_RESET_TTL_MINUTES).toBe(60);
      expect(config.INVITE_TTL_HOURS).toBe(168);
    });

    it.each(["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"])(
      "refuses to boot without %s",
      (name) => {
        const env: Record<string, unknown> = { ...required };
        delete env[name];

        expect(() => validate(env)).toThrow(/Invalid environment configuration/);
      },
    );

    it("rejects a secret too short to resist brute force", () => {
      expect(() =>
        validate({ ...required, JWT_ACCESS_SECRET: "short" }),
      ).toThrow(/JWT_ACCESS_SECRET/);
    });

    it("refuses the same secret for both token kinds", () => {
      expect(() =>
        validate({ ...required, JWT_REFRESH_SECRET: required.JWT_ACCESS_SECRET }),
      ).toThrow(/must differ/);
    });
  });

  describe("mail", () => {
    it("defaults to the log driver, which needs no SMTP settings", () => {
      const config = validate(required);

      expect(config.MAIL_DRIVER).toBe(MailDriver.Log);
      expect(config.WEBAPP_URL).toBe("http://localhost:3001");
    });

    it("requires SMTP_HOST when the smtp driver is chosen", () => {
      expect(() => validate({ ...required, MAIL_DRIVER: "smtp" })).toThrow(
        /SMTP_HOST/,
      );
    });

    it("accepts the smtp driver once SMTP_HOST is set", () => {
      const config = validate({
        ...required,
        MAIL_DRIVER: "smtp",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "465",
        SMTP_SECURE: "true",
      });

      expect(config.SMTP_PORT).toBe(465);
      expect(config.SMTP_SECURE).toBe(true);
    });

    it("refuses the log driver in production, where it would write tokens to logs", () => {
      expect(() =>
        validate({
          ...required,
          NODE_ENV: "production",
          MAIL_DRIVER: "log",
        }),
      ).toThrow(/MAIL_DRIVER/);
    });
  });

  it("keeps a value that is supplied", () => {
    const config = validate({
      ...required,
      NODE_ENV: "production",
      MAIL_DRIVER: "smtp",
      SMTP_HOST: "smtp.example.com",
      CORS_ORIGINS: "https://app.farmclubos.com",
      DIRECT_URL: "postgresql://user:pw@localhost:5432/farmclub",
    });

    expect(config.NODE_ENV).toBe(NodeEnv.Production);
    expect(config.CORS_ORIGINS).toBe("https://app.farmclubos.com");
    expect(config.DIRECT_URL).toBe("postgresql://user:pw@localhost:5432/farmclub");
  });
});
