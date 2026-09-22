import { Module } from "@nestjs/common";
import { CohortsController } from "./cohorts.controller.js";
import { CohortsService } from "./cohorts.service.js";

@Module({
  controllers: [CohortsController],
  providers: [CohortsService],
  // Exported: progress and assessments both start from an enrolment.
  exports: [CohortsService],
})
export class CohortsModule {}
