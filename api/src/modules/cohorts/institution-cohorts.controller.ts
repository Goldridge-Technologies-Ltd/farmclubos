import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { InstitutionAccessService } from "../institutions/institution-access.service.js";
import { CohortsService } from "./cohorts.service.js";
import type { CohortSummaryView, EnrolmentView } from "./cohorts.types.js";
import { CreateCohortDto, EnrolDto } from "./dto/cohort-request.dto.js";
import { CohortSummaryDto, EnrolmentDto } from "./dto/cohort-response.dto.js";

const FORBIDDEN = {
  status: HttpStatus.FORBIDDEN,
  description: "INSUFFICIENT_ROLE: you are a member but not an administrator.",
};
const NOT_FOUND = {
  status: HttpStatus.NOT_FOUND,
  description: "NOT_FOUND: no such institution or cohort you can see.",
};

/*
  The smallest administration needed to put a learner in front of a pathway:
  open an intake, and enrol a member onto it.

  Access is checked with InstitutionAccessService rather than the token's role
  alone, because the token names only the *active* institution and this route
  names one in its path. The wider institution dashboard — listing cohorts,
  managing facilitators, reporting — is a later milestone.
*/
@ApiTags("cohorts")
@ApiBearerAuth()
@Controller("institutions/:institutionId/cohorts")
export class InstitutionCohortsController {
  constructor(
    private readonly cohorts: CohortsService,
    private readonly access: InstitutionAccessService,
  ) {}

  @Post()
  @CustomMessage("Cohort created")
  @ApiOperation({
    summary: "Open an intake of a pathway",
    description: "Institution administrators only. Capacity is deliberately not set.",
  })
  @ApiParam({ name: "institutionId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.CREATED, description: "Created.", type: CohortSummaryDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED or PATHWAY_NOT_FOUND." },
    FORBIDDEN,
    NOT_FOUND,
  )
  async createCohort(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Body() body: CreateCohortDto,
  ): Promise<CohortSummaryView> {
    await this.access.assertCanManage(user, institutionId);

    return this.cohorts.createCohort(institutionId, body);
  }

  @Post(":cohortId/enrolments")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Learner enrolled")
  @ApiOperation({
    summary: "Enrol a member onto a cohort",
    description:
      "The person must already be an active member of the institution. Enrolling " +
      "someone twice is not an error and does not reset their progress.",
  })
  @ApiParam({ name: "institutionId", format: "uuid" })
  @ApiParam({ name: "cohortId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Enrolled.", type: EnrolmentDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED or NOT_A_MEMBER." },
    FORBIDDEN,
    NOT_FOUND,
  )
  async enrol(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
    @Body() body: EnrolDto,
  ): Promise<EnrolmentView> {
    await this.access.assertCanManage(user, institutionId);

    return this.cohorts.enrol(institutionId, cohortId, body);
  }
}
