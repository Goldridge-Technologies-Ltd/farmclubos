import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { IndependentLearnersService } from "./independent-learners.service.js";
import { SelfEnrolmentController } from "./self-enrolment.controller.js";
import { SelfEnrolmentService } from "./self-enrolment.service.js";
import { SignupController } from "./signup.controller.js";
import { SignupService } from "./signup.service.js";

/**
 * People learning on their own: signing up, starting a pathway, and
 * FARMCLUB's home for them.
 */
@Module({
  imports: [AuthModule],
  controllers: [SignupController, SelfEnrolmentController],
  providers: [IndependentLearnersService, SignupService, SelfEnrolmentService],
  exports: [IndependentLearnersService],
})
export class IndependentLearnersModule {}
