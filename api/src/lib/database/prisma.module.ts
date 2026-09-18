import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

/*
  Infrastructure module: global, exports its service, and is imported exactly
  once in AppModule (api/AGENTS.md).
*/
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
