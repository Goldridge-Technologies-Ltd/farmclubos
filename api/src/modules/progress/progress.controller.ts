import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { CompleteLessonDto, CompleteSceneDto } from "./dto/progress-request.dto.js";
import {
  JourneyDto,
  LessonCompletionDto,
  LessonStandingDto,
  SceneCompletionDto,
} from "./dto/progress-response.dto.js";
import { ProgressService } from "./progress.service.js";
import type {
  JourneyView,
  LessonCompletionView,
  LessonStandingView,
  SceneCompletionView,
} from "./progress.types.js";

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

  @Post("scenes/complete")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Scene completed")
  @ApiOperation({
    summary: "Record that you have finished a scene",
    description:
      "Finishing a lesson's last scene completes the lesson. Progress counts scenes, never " +
      "time watched. Finishing a scene again keeps the first date.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Recorded.", type: SceneCompletionDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED." },
    UNAUTHORIZED,
    {
      status: HttpStatus.NOT_FOUND,
      description: "NOT_FOUND: no such published scene, or you are not enrolled on it.",
    },
  )
  completeScene(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CompleteSceneDto,
  ): Promise<SceneCompletionView> {
    return this.progress.completeScene(user, body.sceneId);
  }

  @Get("lessons/:lessonId")
  @CustomMessage("Lesson progress loaded")
  @ApiOperation({
    summary: "Where you stand in a lesson",
    description:
      "Whether you are enrolled on its pathway, its status for you, and the scenes you have " +
      "finished, so you can resume where you stopped.",
  })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: LessonStandingDto })
  @ApiErrors(UNAUTHORIZED, {
    status: HttpStatus.NOT_FOUND,
    description: "NOT_FOUND: no such published lesson.",
  })
  lessonProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ): Promise<LessonStandingView> {
    return this.progress.lessonProgress(user, lessonId);
  }
}
