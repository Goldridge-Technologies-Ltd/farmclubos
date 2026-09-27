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
import { InstitutionAccessService } from "../institutions/institution-access.service.js";
import { CohortsService } from "./cohorts.service.js";
import type {
  CohortDetailView,
  CohortEnrolmentView,
  CohortListItemView,
  CohortSummaryView,
  EnrolmentView,
} from "./cohorts.types.js";
import { CreateCohortDto, EnrolDto, UpdateCohortDto } from "./dto/cohort-request.dto.js";
import {
  CohortDetailDto,
  CohortEnrolmentDto,
  CohortListItemDto,
  CohortSummaryDto,
  EnrolmentDto,
} from "./dto/cohort-response.dto.js";

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

  @Get()
  @CustomMessage("Cohorts loaded")
  @ApiOperation({ summary: "The institution's cohorts", description: "Newest first." })
  @ApiParam({ name: "institutionId", format: "uuid" })
  @ApiEnvelope({
    status: HttpStatus.OK,
    description: "Loaded.",
    type: CohortListItemDto,
    isArray: true,
  })
  @ApiErrors(FORBIDDEN, NOT_FOUND)
  async listCohorts(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
  ): Promise<CohortListItemView[]> {
    await this.access.assertCanManage(user, institutionId);

    return this.cohorts.listForInstitution(institutionId);
  }

  @Get(":cohortId")
  @CustomMessage("Cohort loaded")
  @ApiOperation({
    summary: "One cohort and its learners",
    description: "Each learner's progress is derived from the lessons they have completed.",
  })
  @ApiParam({ name: "institutionId", format: "uuid" })
  @ApiParam({ name: "cohortId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: CohortDetailDto })
  @ApiErrors(FORBIDDEN, NOT_FOUND)
  async getCohort(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
  ): Promise<CohortDetailView> {
    await this.access.assertCanManage(user, institutionId);

    return this.cohorts.getForInstitution(institutionId, cohortId);
  }

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
    { status: HttpStatus.CONFLICT, description: "CODE_TAKEN: another cohort already uses that code." },
    FORBIDDEN,
    NOT_FOUND,
  )
  async createCohort(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Body() body: CreateCohortDto,
  ): Promise<CohortSummaryView> {
    await this.access.assertCanManage(user, institutionId);

    return this.cohorts.createCohort(user.userId, institutionId, body);
  }

  @Post(":cohortId/enrolments")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Learner enrolled")
  @ApiOperation({
    summary: "Enrol a member onto a cohort",
    description:
      "The person must already be an active member of the institution. Enrolling " +
      "someone already on the cohort is not an error and does not reset their progress; " +
      "enrolling someone who was withdrawn reactivates them, progress intact.",
  })
  @ApiParam({ name: "institutionId", format: "uuid" })
  @ApiParam({ name: "cohortId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Enrolled.", type: EnrolmentDto })
  @ApiErrors(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "VALIDATION_FAILED, NOT_A_MEMBER, or COHORT_CLOSED: nobody new joins a closed intake.",
    },
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

    return this.cohorts.enrol(user.userId, institutionId, cohortId, body);
  }

  @Patch(":cohortId")
  @CustomMessage("Cohort updated")
  @ApiOperation({
    summary: "Change a cohort's name, code, delivery mode or dates",
    description:
      "Send only what changes; null clears the code or a date. The pathway cannot be " +
      "changed — learners' progress hangs off it — and is refused if sent.",
  })
  @ApiParam({ name: "institutionId", format: "uuid" })
  @ApiParam({ name: "cohortId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Updated.", type: CohortSummaryDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED or DATES_OUT_OF_ORDER." },
    { status: HttpStatus.CONFLICT, description: "CODE_TAKEN: another cohort already uses that code." },
    FORBIDDEN,
    NOT_FOUND,
  )
  async updateCohort(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
    @Body() body: UpdateCohortDto,
  ): Promise<CohortSummaryView> {
    await this.access.assertCanManage(user, institutionId);

    return this.cohorts.updateCohort(user.userId, institutionId, cohortId, body);
  }

  @Post(":cohortId/close")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Cohort closed")
  @ApiOperation({
    summary: "Close an intake that has finished",
    description:
      "Nobody new can be enrolled. Learners already on it can still finish their own " +
      "work; withdraw someone to stop them. Closing a closed cohort is not an error.",
  })
  @ApiParam({ name: "institutionId", format: "uuid" })
  @ApiParam({ name: "cohortId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Closed.", type: CohortSummaryDto })
  @ApiErrors(FORBIDDEN, NOT_FOUND)
  async closeCohort(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
  ): Promise<CohortSummaryView> {
    await this.access.assertCanManage(user, institutionId);

    return this.cohorts.closeCohort(user.userId, institutionId, cohortId);
  }

  @Post(":cohortId/reopen")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Cohort reopened")
  @ApiOperation({ summary: "Reopen a closed intake", description: "For one closed by mistake." })
  @ApiParam({ name: "institutionId", format: "uuid" })
  @ApiParam({ name: "cohortId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Reopened.", type: CohortSummaryDto })
  @ApiErrors(FORBIDDEN, NOT_FOUND)
  async reopenCohort(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
  ): Promise<CohortSummaryView> {
    await this.access.assertCanManage(user, institutionId);

    return this.cohorts.reopenCohort(user.userId, institutionId, cohortId);
  }

  @Post(":cohortId/enrolments/:enrolmentId/withdraw")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Learner withdrawn")
  @ApiOperation({
    summary: "Withdraw a learner from a cohort",
    description:
      "Their progress is kept; enrolling them again resumes it. A finished enrolment " +
      "cannot be withdrawn.",
  })
  @ApiParam({ name: "institutionId", format: "uuid" })
  @ApiParam({ name: "cohortId", format: "uuid" })
  @ApiParam({ name: "enrolmentId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Withdrawn.", type: CohortEnrolmentDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "ENROLMENT_COMPLETED." },
    FORBIDDEN,
    NOT_FOUND,
  )
  async withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
    @Param("enrolmentId", ParseUUIDPipe) enrolmentId: string,
  ): Promise<CohortEnrolmentView> {
    await this.access.assertCanManage(user, institutionId);

    return this.cohorts.withdraw(user.userId, institutionId, cohortId, enrolmentId);
  }
}
