import { Controller, Get, HttpStatus, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { CohortsService } from "./cohorts.service.js";
import type { EnrolmentView } from "./cohorts.types.js";
import { EnrolmentDto } from "./dto/cohort-response.dto.js";

const UNAUTHORIZED = { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." };

/*
  The caller's own enrolments, in the institution their token is pinned to.
  There is no route to another learner's, and no route that lists a cohort's
  members — that belongs to the institution dashboard, which is a later
  milestone with its own authorisation.
*/
@ApiTags("cohorts")
@ApiBearerAuth()
@Controller("enrolments")
export class CohortsController {
  constructor(private readonly cohorts: CohortsService) {}

  @Get("mine")
  @CustomMessage("Enrolments loaded")
  @ApiOperation({
    summary: "Your enrolments",
    description:
      "Most recent first, in your active institution. Withdrawn enrolments are left " +
      "out. Empty for someone who belongs to no institution.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: EnrolmentDto, isArray: true })
  @ApiErrors(UNAUTHORIZED)
  listMine(@CurrentUser() user: AuthenticatedUser): Promise<EnrolmentView[]> {
    return this.cohorts.listMine(user);
  }

  @Get("mine/:enrolmentId")
  @CustomMessage("Enrolment loaded")
  @ApiOperation({
    summary: "One of your enrolments",
    description: "Someone else's id answers 404, so an id is never confirmed.",
  })
  @ApiParam({ name: "enrolmentId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: EnrolmentDto })
  @ApiErrors(UNAUTHORIZED, {
    status: HttpStatus.NOT_FOUND,
    description: "NOT_FOUND: no such enrolment of yours.",
  })
  getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param("enrolmentId", ParseUUIDPipe) enrolmentId: string,
  ): Promise<EnrolmentView> {
    return this.cohorts.getMine(user, enrolmentId);
  }
}
