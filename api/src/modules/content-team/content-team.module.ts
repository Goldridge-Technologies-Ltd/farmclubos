import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { InstitutionsModule } from "../institutions/institutions.module.js";
import { ContentTeamController } from "./content-team.controller.js";
import { ContentTeamService } from "./content-team.service.js";

@Module({
  imports: [AuthModule, InstitutionsModule],
  controllers: [ContentTeamController],
  providers: [ContentTeamService],
})
export class ContentTeamModule {}
