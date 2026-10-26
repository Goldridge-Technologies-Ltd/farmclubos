import { Controller, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { StartedPathwayDto } from "./dto/independent-learners-response.dto.js";
import type { StartedPathwayView } from "./independent-learners.types.js";
import { SelfEnrolmentService } from "./self-enrolment.service.js";

/*
  Starting a pathway on one's own, from the Academy. Anyone signed in may;
  SelfEnrolmentService says what it does.
*/
@ApiTags("academy")
@ApiBearerAuth()
@Controller("academy")
export class SelfEnrolmentController {
  constructor(private readonly enrolments: SelfEnrolmentService) {}

  @Post("pathways/:pathwaySlug/start")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Pathway started")
  @ApiOperation({
    summary: "Start a pathway on one's own",
    description:
      "Makes the caller an independent learner and enrols them on the pathway's self-paced " +
      "cohort, or brings back their withdrawn enrolment there. Starting again changes nothing. " +
      "When the session moves to independent learning, a fresh access token comes back.",
  })
  @ApiParam({ name: "pathwaySlug", example: "agricultural-entrepreneurship-foundation" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Started.", type: StartedPathwayDto })
  @ApiErrors(
    { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." },
    {
      status: HttpStatus.FORBIDDEN,
      description: "MEMBERSHIP_SUSPENDED: the platform team has stopped this account learning on its own.",
    },
    { status: HttpStatus.NOT_FOUND, description: "NOT_FOUND: no such slug, or it is not published." },
    {
      status: HttpStatus.CONFLICT,
      description:
        "ENROLLED_WITH_INSTITUTION: the caller is taking it with an institution; " +
        "PATHWAY_NOT_TAKING_LEARNERS: its self-paced cohort is closed.",
    },
  )
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param("pathwaySlug") pathwaySlug: string,
  ): Promise<StartedPathwayView> {
    return this.enrolments.start(user, pathwaySlug);
  }
}
