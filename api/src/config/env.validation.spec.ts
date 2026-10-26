import { MailDriver, NodeEnv, StorageDriver, validate } from "./env.validation.js";

/** The variables with no safe default: everything else may be omitted. */
const required = {
  DATABASE_URL: "postgresql://user:pw@localhost:5432/farmclub",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
};

const s3 = {
  STORAGE_DRIVER: "s3",
  STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
  STORAGE_BUCKET: "farmclub-media",
  STORAGE_ACCESS_KEY_ID: "key-id",
  STORAGE_SECRET_ACCESS_KEY: "secret",
};

/** Production's own requirements, bar storage, which some specs leave out on purpose. */
const production = {
  NODE_ENV: "production",
  MAIL_DRIVER: "smtp",
  SMTP_HOST: "smtp.example.com",
  WEBAPP_URL: "https://app.farmclubos.com",
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

    it("requires ZEPTOMAIL_API_KEY when the zeptomail driver is chosen", () => {
      expect(() => validate({ ...required, MAIL_DRIVER: "zeptomail" })).toThrow(
        /ZEPTOMAIL_API_KEY/,
      );
    });

    it("accepts the zeptomail driver with its key, sending to the US data centre by default", () => {
      const config = validate({
        ...required,
        MAIL_DRIVER: "zeptomail",
        ZEPTOMAIL_API_KEY: "wSsVR61-key",
      });

      expect(config.MAIL_DRIVER).toBe(MailDriver.ZeptoMail);
      expect(config.ZEPTOMAIL_API_HOST).toBe("cpaas.zoho.com");
    });

    /*
      The host is the one a Mail Agent's SMTP/API page shows. Pasting the
      whole URL, as people do, still finds it.
    */
    it("takes the data centre's host from a pasted URL", () => {
      const config = validate({
        ...required,
        MAIL_DRIVER: "zeptomail",
        ZEPTOMAIL_API_KEY: "wSsVR61-key",
        ZEPTOMAIL_API_HOST: "https://cpaas.zoho.eu/v1.1/email",
      });

      expect(config.ZEPTOMAIL_API_HOST).toBe("cpaas.zoho.eu");
    });

    it("refuses a ZEPTOMAIL_API_HOST that is not a host name", () => {
      expect(() =>
        validate({
          ...required,
          MAIL_DRIVER: "zeptomail",
          ZEPTOMAIL_API_KEY: "wSsVR61-key",
          ZEPTOMAIL_API_HOST: "not a host",
        }),
      ).toThrow(/ZEPTOMAIL_API_HOST/);
    });

    it("accepts the zeptomail driver in production, for hosts that block SMTP", () => {
      const config = validate({
        ...required,
        ...production,
        ...s3,
        MAIL_DRIVER: "zeptomail",
        ZEPTOMAIL_API_KEY: "wSsVR61-key",
      });

      expect(config.MAIL_DRIVER).toBe(MailDriver.ZeptoMail);
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

    it("refuses the local default for WEBAPP_URL in production, where every emailed link would lead nowhere", () => {
      expect(() =>
        validate({ ...required, ...production, ...s3, WEBAPP_URL: "http://localhost:3001" }),
      ).toThrow(/WEBAPP_URL/);
    });

    it("refuses a plain http WEBAPP_URL in production, where the web app only works over https", () => {
      expect(() =>
        validate({ ...required, ...production, ...s3, WEBAPP_URL: "http://app.farmclubos.com" }),
      ).toThrow(/WEBAPP_URL/);
    });

    it("accepts the web app's https address in production", () => {
      const config = validate({ ...required, ...production, ...s3 });

      expect(config.WEBAPP_URL).toBe("https://app.farmclubos.com");
    });
  });

  describe("storage", () => {
    it("keeps files in a folder by default outside production, needing nothing else", () => {
      const config = validate(required);

      expect(config.STORAGE_DRIVER).toBe(StorageDriver.Local);
      expect(config.STORAGE_LOCAL_DIR).toBe(".storage");
      expect(config.STORAGE_LOCAL_PUBLIC_URL).toBeUndefined();
    });

    it("switches to S3-compatible storage with STORAGE_DRIVER=s3 and its settings", () => {
      const config = validate({ ...required, ...s3 });

      expect(config.STORAGE_DRIVER).toBe(StorageDriver.S3);
      expect(config.STORAGE_BUCKET).toBe("farmclub-media");
      expect(config.STORAGE_REGION).toBe("auto");
    });

    it("needs every S3 setting with the s3 driver, rather than failing at the first upload", () => {
      expect(() =>
        validate({ ...required, STORAGE_DRIVER: "s3", STORAGE_BUCKET: "farmclub-media" }),
      ).toThrow(/STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY/);
    });

    it("leaves S3 settings alone while the local driver is chosen, so switching is one line", () => {
      const config = validate({ ...required, ...s3, STORAGE_DRIVER: "local", STORAGE_ENDPOINT: "localhost:9000" });

      expect(config.STORAGE_DRIVER).toBe(StorageDriver.Local);
    });

    it("refuses a driver it does not know", () => {
      expect(() => validate({ ...required, STORAGE_DRIVER: "minio" })).toThrow(
        /Invalid environment configuration/,
      );
    });

    it("refuses the local driver in production, where lesson media lives in R2", () => {
      expect(() => validate({ ...required, ...production })).toThrow(/STORAGE_DRIVER/);
    });

    it("accepts S3 storage in production", () => {
      expect(validate({ ...required, ...production, ...s3 }).STORAGE_DRIVER).toBe(StorageDriver.S3);
    });

    it("takes another address for the local store, such as one a phone on the network can reach", () => {
      const address = "http://192.168.1.20:4000/api/storage";

      expect(validate({ ...required, STORAGE_LOCAL_PUBLIC_URL: address }).STORAGE_LOCAL_PUBLIC_URL).toBe(address);
      expect(() => validate({ ...required, STORAGE_LOCAL_PUBLIC_URL: "not an address" })).toThrow(
        /Invalid environment configuration/,
      );
    });
  });

  it("keeps a value that is supplied", () => {
    const config = validate({
      ...required,
      NODE_ENV: "production",
      MAIL_DRIVER: "smtp",
      SMTP_HOST: "smtp.example.com",
      STORAGE_DRIVER: "s3",
      STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
      STORAGE_BUCKET: "farmclub-media",
      STORAGE_ACCESS_KEY_ID: "key-id",
      STORAGE_SECRET_ACCESS_KEY: "secret",
      WEBAPP_URL: "https://app.farmclubos.com",
      CORS_ORIGINS: "https://app.farmclubos.com",
      DIRECT_URL: "postgresql://user:pw@localhost:5432/farmclub",
    });

    expect(config.NODE_ENV).toBe(NodeEnv.Production);
    expect(config.CORS_ORIGINS).toBe("https://app.farmclubos.com");
    expect(config.DIRECT_URL).toBe("postgresql://user:pw@localhost:5432/farmclub");
  });
});
