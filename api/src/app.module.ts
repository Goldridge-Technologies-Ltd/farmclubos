import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { globalProviders } from "./app.providers.js";
import { validate } from "./config/env.validation.js";
import { PrismaModule } from "./lib/database/prisma.module.js";
import { MailModule } from "./lib/mail/mail.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { InstitutionsModule } from "./modules/institutions/institutions.module.js";
import { InvitesModule } from "./modules/invites/invites.module.js";

@Module({
  imports: [
    /*
      Infrastructure modules are imported once, here. ConfigModule validates the
      environment at boot, so a missing variable stops the process instead of
      surfacing as a runtime failure later.
    */
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate }),
    PrismaModule,
    MailModule,
    AuthModule,
    HealthModule,
    InstitutionsModule,
    InvitesModule,
  ],
  providers: globalProviders,
})
export class AppModule {}
