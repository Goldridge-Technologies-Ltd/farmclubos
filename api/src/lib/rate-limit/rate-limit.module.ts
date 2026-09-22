import { Global, Module } from "@nestjs/common";
import { RateLimitService } from "./rate-limit.service.js";

/*
  Infrastructure module: global, exports its service, imported once in
  AppModule (api/AGENTS.md).
*/
@Global()
@Module({
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
