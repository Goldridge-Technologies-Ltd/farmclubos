import { Module } from "@nestjs/common";
import { ProgressModule } from "../progress/progress.module.js";
import { ContentAccessService } from "./content-access.service.js";
import { CurriculumController } from "./curriculum.controller.js";
import { CurriculumService } from "./curriculum.service.js";
import { ScenesController } from "./scenes.controller.js";
import { ScenesService } from "./scenes.service.js";

/*
  The content team's side of the Academy. The learner's side stays in the
  academy module, read-only; this one writes. ProgressModule is imported so a
  change of content can recalculate learners' progress.
*/
@Module({
  imports: [ProgressModule],
  controllers: [CurriculumController, ScenesController],
  providers: [CurriculumService, ScenesService, ContentAccessService],
})
export class AuthoringModule {}
