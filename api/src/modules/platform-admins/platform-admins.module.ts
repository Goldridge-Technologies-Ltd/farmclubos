import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PlatformAdminsService } from "./platform-admins.service.js";

/**
 * Making platform administrators. Deliberately not imported by AppModule and
 * given no controller: only the server's command (src/cli/) reaches it.
 */
@Module({
  imports: [AuthModule],
  providers: [PlatformAdminsService],
  exports: [PlatformAdminsService],
})
export class PlatformAdminsModule {}
