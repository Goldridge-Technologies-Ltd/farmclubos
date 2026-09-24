import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { CompleteLessonDto } from "./dto/progress-request.dto.js";
import { JourneyDto, LessonCompletionDto } from "./dto/progress-response.dto.js";
import { ProgressService } from "./progress.service.js";
import type { JourneyView, LessonCompletionView } from "./progress.types.js";

const UNAUTHORIZED = { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." };

/*
  What the caller has done. Progress is always the caller's own: the enrolment
  is resolved from their token, never taken from the request, so there is no
  route through which one learner could write against another's record.
*/
@ApiTags("progress")
@ApiBearerAuth()
@Controller("progress")
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get("mine")
  @CustomMessage("Journey loaded")
  @ApiOperation({
    summary: "Your journey",
    description:
      "Every enrolment you hold, with each module's lessons and what you have " +
      "completed. Empty for someone who belongs to no institution.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: JourneyDto, isArray: true })
  @ApiErrors(UNAUTHORIZED)
  myJourney(@CurrentUser() user: AuthenticatedUser): Promise<JourneyView[]> {
    return this.progress.myJourney(user);
  }

  @Post("lessons/complete")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Lesson completed")
  @ApiOperation({
    summary: "Mark a lesson complete",
    description:
      "Recomputes the module's status and your percentage through the pathway from " +
      "what is recorded. Completing twice is not an error and does not move the " +
      "original date.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Recorded.", type: LessonCompletionDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED." },
    UNAUTHORIZED,
    {
      status: HttpStatus.NOT_FOUND,
      description: "NOT_FOUND: no such published lesson, or you are not enrolled on it.",
    },
  )
  completeLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CompleteLessonDto,
  ): Promise<LessonCompletionView> {
    return this.progress.completeLesson(user, body.lessonId);
  }
}
