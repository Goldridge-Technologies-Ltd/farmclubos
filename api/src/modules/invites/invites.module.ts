import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { InstitutionsModule } from "../institutions/institutions.module.js";
import { InstitutionInvitesController } from "./institution-invites.controller.js";
import { InvitesController } from "./invites.controller.js";
import { InvitesService } from "./invites.service.js";

@Module({
  imports: [AuthModule, InstitutionsModule],
  controllers: [InstitutionInvitesController, InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
