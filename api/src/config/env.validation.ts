import { Type, plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from "class-validator";

export enum NodeEnv {
  Development = "development",
  Test = "test",
  Production = "production",
}

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
  PORT = 3002;

  @IsString()
  @MinLength(1)
  API_GLOBAL_PREFIX = "api";

  /** Comma-separated browser origins allowed to call the API directly. */
  @IsString()
  CORS_ORIGINS = "http://localhost:3000,http://localhost:3001";
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

  return validated;
}
