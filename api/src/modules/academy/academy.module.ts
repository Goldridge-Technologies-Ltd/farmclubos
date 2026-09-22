import { Module } from "@nestjs/common";
import { AcademyController } from "./academy.controller.js";
import { AcademyService } from "./academy.service.js";

@Module({
  controllers: [AcademyController],
  providers: [AcademyService],
  // Exported: the progress and assessment modules resolve the same slugs.
  exports: [AcademyService],
})
export class AcademyModule {}
