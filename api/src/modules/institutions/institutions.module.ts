import { Module } from "@nestjs/common";
import { InstitutionAccessService } from "./institution-access.service.js";
import { InstitutionsController } from "./institutions.controller.js";
import { InstitutionsService } from "./institutions.service.js";

@Module({
  controllers: [InstitutionsController],
  providers: [InstitutionsService, InstitutionAccessService],
  // Any module that acts inside an institution checks access through this.
  exports: [InstitutionAccessService],
})
export class InstitutionsModule {}
