import { Module } from "@nestjs/common";
import { InstitutionsModule } from "../institutions/institutions.module.js";
import { CohortsController } from "./cohorts.controller.js";
import { CohortsService } from "./cohorts.service.js";
import { InstitutionCohortsController } from "./institution-cohorts.controller.js";

@Module({
  // For InstitutionAccessService, which checks access to the institution named
  // in the path rather than the one in the token.
  imports: [InstitutionsModule],
  controllers: [CohortsController, InstitutionCohortsController],
  providers: [CohortsService],
  // Exported: progress and assessments both start from an enrolment.
  exports: [CohortsService],
})
export class CohortsModule {}
