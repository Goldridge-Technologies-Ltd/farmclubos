import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { AssessmentsService } from "./assessments.service.js";
import type { AssessmentView, AttemptView } from "./assessments.types.js";
import { SaveAnswersDto } from "./dto/assessment-request.dto.js";
import { AssessmentDto, AttemptDto } from "./dto/assessment-response.dto.js";

const UNAUTHORIZED = { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." };
const NOT_YOURS = {
  status: HttpStatus.NOT_FOUND,
  description: "NOT_FOUND: no such assessment or attempt of yours.",
};

/*
  Taking an assessment. Every route resolves the caller's own enrolment from
  their token, so an assessment or attempt id is only ever usable by the
  person it belongs to.
*/
@ApiTags("assessments")
@ApiBearerAuth()
@Controller("assessments")
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get(":assessmentId")
  @CustomMessage("Assessment loaded")
  @ApiOperation({
    summary: "One assessment and its questions",
    description: "Options carry no answer key; grading happens in the API.",
  })
  @ApiParam({ name: "assessmentId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: AssessmentDto })
  @ApiErrors(UNAUTHORIZED, NOT_YOURS)
  getAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("assessmentId", ParseUUIDPipe) assessmentId: string,
  ): Promise<AssessmentView> {
    return this.assessments.getAssessment(user, assessmentId);
  }

  @Post(":assessmentId/attempts")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Attempt ready")
  @ApiOperation({
    summary: "Start or resume an attempt",
    description:
      "Returns the attempt already in progress if there is one, so a reload neither " +
      "uses up an attempt nor loses saved answers.",
  })
  @ApiParam({ name: "assessmentId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Ready.", type: AttemptDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "NO_ATTEMPTS_LEFT." },
    UNAUTHORIZED,
    NOT_YOURS,
  )
  startAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param("assessmentId", ParseUUIDPipe) assessmentId: string,
  ): Promise<AttemptView> {
    return this.assessments.startAttempt(user, assessmentId);
  }

  @Get("attempts/:attemptId")
  @CustomMessage("Attempt loaded")
  @ApiOperation({ summary: "One of your attempts" })
  @ApiParam({ name: "attemptId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: AttemptDto })
  @ApiErrors(UNAUTHORIZED, NOT_YOURS)
  getAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
  ): Promise<AttemptView> {
    return this.assessments.getAttempt(user, attemptId);
  }

  @Patch("attempts/:attemptId")
  @CustomMessage("Answers saved")
  @ApiOperation({
    summary: "Save answers as they are given",
    description:
      "Each answer replaces any earlier answer to the same question. Options that " +
      "belong to another question are ignored.",
  })
  @ApiParam({ name: "attemptId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Saved.", type: AttemptDto })
  @ApiErrors(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "VALIDATION_FAILED or ATTEMPT_ALREADY_SUBMITTED.",
    },
    UNAUTHORIZED,
    NOT_YOURS,
  )
  saveAnswers(
    @CurrentUser() user: AuthenticatedUser,
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
    @Body() body: SaveAnswersDto,
  ): Promise<AttemptView> {
    return this.assessments.saveAnswers(user, attemptId, body.answers);
  }

  @Post("attempts/:attemptId/submit")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Attempt submitted")
  @ApiOperation({
    summary: "Submit an attempt for grading",
    description:
      "Graded at once against the answer key. Written answers are left out of the " +
      "score for a person to mark, rather than counted wrong.",
  })
  @ApiParam({ name: "attemptId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Graded.", type: AttemptDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "ATTEMPT_ALREADY_SUBMITTED." },
    UNAUTHORIZED,
    NOT_YOURS,
  )
  submitAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
  ): Promise<AttemptView> {
    return this.assessments.submitAttempt(user, attemptId);
  }
}
