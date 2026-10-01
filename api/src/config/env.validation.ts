import { Transform, Type, plainToInstance } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from "class-validator";

export enum NodeEnv {
  Development = "development",
  Test = "test",
  Production = "production",
}

export enum MailDriver {
  /** Writes each email, links included, to the server log. Development only. */
  Log = "log",
  Smtp = "smtp",
}

export enum StorageDriver {
  /** A folder on this machine, served by the API itself. Development only. */
  Local = "local",
  /** S3-compatible storage: Cloudflare R2 in production, RustFS locally. */
  S3 = "s3",
}

/** The S3 settings are checked only while the s3 driver is the one in use. */
const usesS3 = (env: EnvironmentVariables) => env.STORAGE_DRIVER === StorageDriver.S3;

/** Environment strings "true"/"false" are both truthy, so parse explicitly. */
const toBoolean = ({ value }: { value: unknown }) =>
  value === true || value === "true" || value === "1";

/*
  The shape of the environment, validated once at boot so a missing or
  malformed variable crashes the process on startup rather than on the first
  request that needs it. Every variable here is documented in
  docs/guides/local-dev.md.
*/
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  @IsString()
  @MinLength(1)
  API_GLOBAL_PREFIX = "api";

  /** Comma-separated browser origins allowed to call the API directly. */
  @IsString()
  CORS_ORIGINS = "http://localhost:3000,http://localhost:3001";

  /** The connection the running application uses, through the pg adapter. */
  @IsString()
  @MinLength(1)
  DATABASE_URL: string;

  /**
   * The connection the Prisma CLI uses for migrations, when it differs from
   * DATABASE_URL. Migrations run DDL and take advisory locks, so they need a
   * direct or session connection rather than a transaction pooler.
   */
  @IsOptional()
  @IsString()
  DIRECT_URL?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  DATABASE_POOL_MAX = 10;

  /** Signs access tokens (HS256). Generate with `openssl rand -base64 32`. */
  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  /**
   * Keys the HMAC that derives each rotated refresh token from the last one.
   * Refresh tokens are opaque rather than JWTs; this secret is what makes their
   * rotation deterministic. Must differ from JWT_ACCESS_SECRET.
   */
  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(3600)
  ACCESS_TOKEN_TTL_SECONDS = 900;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  REFRESH_TOKEN_TTL_DAYS = 30;

  /**
   * How long a just-rotated refresh token is still honoured. Concurrent
   * requests (prefetching, parallel renders) can present the same token twice;
   * without this window the second looks like theft and signs the user out.
   */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  REFRESH_REUSE_GRACE_SECONDS = 30;

  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(1440)
  PASSWORD_RESET_TTL_MINUTES = 60;

  /*
    Sign-in throttling. Counts failed attempts against the account, because
    behind the web app every request reaches the API from one address. A
    blocked key is refused for the same length as the window.
  */
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(100)
  LOGIN_MAX_FAILURES = 8;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(86400)
  LOGIN_THROTTLE_WINDOW_SECONDS = 900;

  /** Reset requests allowed per email, so an inbox cannot be flooded. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  PASSWORD_RESET_MAX_REQUESTS = 5;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(86400)
  PASSWORD_RESET_THROTTLE_WINDOW_SECONDS = 3600;

  /** How long an invitation link stays usable. Defaults to seven days. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  INVITE_TTL_HOURS = 168;

  /** Where links in emails point: the web app, never the API. */
  @IsUrl({ require_tld: false, require_protocol: true })
  WEBAPP_URL = "http://localhost:3001";

  @IsEnum(MailDriver)
  MAIL_DRIVER: MailDriver = MailDriver.Log;

  @IsString()
  @MinLength(3)
  MAIL_FROM = "FARMCLUB OS <no-reply@farmclubos.com>";

  @ValidateIf((env: EnvironmentVariables) => env.MAIL_DRIVER === MailDriver.Smtp)
  @IsString()
  @MinLength(1)
  SMTP_HOST?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  SMTP_PORT = 587;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASSWORD?: string;

  /** true for implicit TLS (usually port 465); false upgrades with STARTTLS. */
  @Transform(toBoolean)
  @IsBoolean()
  SMTP_SECURE = false;

  /*
    Where lesson videos, captions and images are kept. "local" keeps them in a
    folder and needs nothing else; "s3" uses the STORAGE_* settings below. The
    S3 settings may stay in place while "local" is chosen, so switching is a
    one-line change. Production requires "s3".
  */
  @IsEnum(StorageDriver)
  STORAGE_DRIVER: StorageDriver = StorageDriver.Local;

  /** The local driver's folder, relative to where the API runs (`api/`). */
  @IsString()
  @MinLength(1)
  STORAGE_LOCAL_DIR = ".storage";

  /**
   * The address the browser reaches the local driver's files at. Defaults to
   * this API's own: http://localhost:<PORT>/<API_GLOBAL_PREFIX>/storage.
   */
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  STORAGE_LOCAL_PUBLIC_URL?: string;

  @ValidateIf(usesS3)
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  STORAGE_ENDPOINT?: string;

  /** R2 takes "auto"; RustFS accepts any region name. */
  @IsString()
  @MinLength(1)
  STORAGE_REGION = "auto";

  @ValidateIf(usesS3)
  @IsOptional()
  @IsString()
  @MinLength(3)
  STORAGE_BUCKET?: string;

  @ValidateIf(usesS3)
  @IsOptional()
  @IsString()
  @MinLength(1)
  STORAGE_ACCESS_KEY_ID?: string;

  @ValidateIf(usesS3)
  @IsOptional()
  @IsString()
  @MinLength(1)
  STORAGE_SECRET_ACCESS_KEY?: string;
}

const S3_VARIABLES = [
  "STORAGE_ENDPOINT",
  "STORAGE_BUCKET",
  "STORAGE_ACCESS_KEY_ID",
  "STORAGE_SECRET_ACCESS_KEY",
] as const;

/** "a", "a and b", "a, b and c". */
function listOf(items: readonly string[]): string {
  return items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Coerces and validates `process.env` for `ConfigModule.forRoot({ validate })`.
 * Returns the typed instance, so `ConfigService` serves coerced values.
 */
export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const detail = errors
      .map((error) => Object.values(error.constraints ?? {}).join(", "))
      .join("; ");

    throw new Error(`Invalid environment configuration: ${detail}`);
  }

  // Rules that span variables, which the per-field decorators cannot express.
  if (validated.JWT_ACCESS_SECRET === validated.JWT_REFRESH_SECRET) {
    throw new Error(
      "Invalid environment configuration: JWT_ACCESS_SECRET and " +
        "JWT_REFRESH_SECRET must differ, so one leaking does not expose both",
    );
  }

  if (
    validated.NODE_ENV === NodeEnv.Production &&
    validated.MAIL_DRIVER === MailDriver.Log
  ) {
    throw new Error(
      "Invalid environment configuration: MAIL_DRIVER must not be log in " +
        "production, where it would write invite and reset links to the logs",
    );
  }

  if (
    validated.NODE_ENV === NodeEnv.Production &&
    validated.STORAGE_DRIVER !== StorageDriver.S3
  ) {
    throw new Error(
      "Invalid environment configuration: STORAGE_DRIVER must be s3 in production, " +
        "where lesson media lives in Cloudflare R2; local keeps files on this machine " +
        "and is for development",
    );
  }

  const missing = S3_VARIABLES.filter((name) => !validated[name]);

  if (validated.STORAGE_DRIVER === StorageDriver.S3 && missing.length > 0) {
    throw new Error(
      `Invalid environment configuration: STORAGE_DRIVER=s3 needs ${listOf(missing)}`,
    );
  }

  return validated;
}
