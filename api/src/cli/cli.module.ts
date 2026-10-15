import { Module } from "@nestjs/common";
import { AppModule } from "../app.module.js";
import { PlatformAdminsModule } from "../modules/platform-admins/platform-admins.module.js";

/**
 * The API's modules, plus those only a command run on the server may reach.
 * Started as an application context, without the HTTP server, so the
 * environment is validated exactly as at boot.
 */
@Module({ imports: [AppModule, PlatformAdminsModule] })
export class CliModule {}
