import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { IndependentLearnersService } from "./independent-learners.service.js";
import { SignupController } from "./signup.controller.js";
import { SignupService } from "./signup.service.js";

/** People learning on their own: signing up, and FARMCLUB's home for them. */
@Module({
  imports: [AuthModule],
  controllers: [SignupController],
  providers: [IndependentLearnersService, SignupService],
  exports: [IndependentLearnersService],
})
export class IndependentLearnersModule {}
