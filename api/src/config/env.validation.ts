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
  if (
    validated.NODE_ENV === NodeEnv.Production &&
    validated.MAIL_DRIVER === MailDriver.Log
  ) {
    throw new Error(
      "Invalid environment configuration: MAIL_DRIVER must not be log in " +
        "production, where it would write invite and reset links to the logs",
    );
  }

  return validated;
}
