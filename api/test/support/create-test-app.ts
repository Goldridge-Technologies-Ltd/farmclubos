import {
  Global,
  Module,
  type DynamicModule,
  type INestApplication,
  type Provider,
  type Type,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { globalProviders } from "../../src/app.providers.js";
import { applyGlobalPrefix, applyNotFoundFallback } from "../../src/app.setup.js";
import { ACCESS_TOKEN_AUDIENCE, ACCESS_TOKEN_ISSUER } from "../../src/common/auth/access-token.js";
import type { AccessTokenClaims } from "../../src/common/auth/access-token.js";
import { PrismaService } from "../../src/lib/database/prisma.service.js";
import { MailService } from "../../src/lib/mail/mail.service.js";

export const TEST_ENV = {
  NODE_ENV: "test",
  API_GLOBAL_PREFIX: "api",
  JWT_ACCESS_SECRET: "e2e-access-secret-that-is-long-enough",
  JWT_REFRESH_SECRET: "e2e-refresh-secret-that-is-long-enough",
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_DAYS: 30,
  REFRESH_REUSE_GRACE_SECONDS: 30,
  PASSWORD_RESET_TTL_MINUTES: 60,
  WEBAPP_URL: "http://localhost:3001",
  MAIL_FROM: "FARMCLUB OS <no-reply@farmclubos.com>",
};

type TestAppOptions = {
  imports: Array<Type<unknown> | DynamicModule>;
  /** Providers to replace, typically a feature service with a stub. */
  overrides?: Array<{ provide: unknown; useValue: unknown }>;
};

/**
 * Builds an app with the real request pipeline — validation, guards,
 * envelope, error filter and route prefix — around the modules under test.
 * The database and mail are always stubbed: these specs cover HTTP contracts.
 */
export async function createTestApp({ imports, overrides = [] }: TestAppOptions): Promise<{
  app: INestApplication;
  signAccessToken: (claims: Partial<AccessTokenClaims>) => Promise<string>;
}> {
  // Mirrors the app's @Global() infrastructure modules. Replace either with a
  // richer stub through `overrides`.
  @Global()
  @Module({
    providers: [
      { provide: PrismaService, useValue: {} } satisfies Provider,
      { provide: MailService, useValue: {} } satisfies Provider,
    ],
    exports: [PrismaService, MailService],
  })
  class StubInfrastructureModule {}

  let builder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => TEST_ENV] }),
      JwtModule.register({ global: true, secret: TEST_ENV.JWT_ACCESS_SECRET }),
      StubInfrastructureModule,
      ...imports,
    ],
    providers: globalProviders,
  });

  for (const override of overrides) {
    builder = builder.overrideProvider(override.provide).useValue(override.useValue);
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  applyGlobalPrefix(app, TEST_ENV.API_GLOBAL_PREFIX);
  await app.init();
  applyNotFoundFallback(app);

  const jwt = moduleRef.get(JwtService);

  const signAccessToken = (claims: Partial<AccessTokenClaims>) =>
    jwt.signAsync(
      {
        sub: "user-1",
        sid: "session-1",
        email: "ada@example.com",
        platformRole: "NONE",
        institutionId: null,
        institutionRole: null,
        ...claims,
      },
      {
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
        algorithm: "HS256",
        expiresIn: 300,
      },
    );

  return { app, signAccessToken };
}
