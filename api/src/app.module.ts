import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { globalProviders } from "./app.providers.js";
import { validate } from "./config/env.validation.js";
import { PrismaModule } from "./lib/database/prisma.module.js";
import { MailModule } from "./lib/mail/mail.module.js";
import { RateLimitModule } from "./lib/rate-limit/rate-limit.module.js";
import { StorageModule } from "./lib/storage/storage.module.js";
import { AcademyModule } from "./modules/academy/academy.module.js";
import { AssessmentsModule } from "./modules/assessments/assessments.module.js";
import { AuthoringModule } from "./modules/authoring/authoring.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { CohortsModule } from "./modules/cohorts/cohorts.module.js";
import { ContentTeamModule } from "./modules/content-team/content-team.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { IndependentLearnersModule } from "./modules/independent-learners/independent-learners.module.js";
import { InstitutionsModule } from "./modules/institutions/institutions.module.js";
import { InvitesModule } from "./modules/invites/invites.module.js";
import { ProgressModule } from "./modules/progress/progress.module.js";
import { UsersModule } from "./modules/users/users.module.js";

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
    RateLimitModule,
    StorageModule,
    AcademyModule,
    AssessmentsModule,
    AuthoringModule,
    AuthModule,
    CohortsModule,
    ContentTeamModule,
    HealthModule,
    IndependentLearnersModule,
    InstitutionsModule,
    InvitesModule,
    ProgressModule,
    UsersModule,
  ],
  providers: globalProviders,
})
export class AppModule {}
