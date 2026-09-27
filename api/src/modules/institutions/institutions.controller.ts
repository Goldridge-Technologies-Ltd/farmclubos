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
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { PlatformRoles } from "../../common/decorators/roles.decorator.js";
import type { PaginatedResult } from "../../common/http/api-response.js";
import {
  CreateInstitutionDto,
  InstitutionListQueryDto,
  UpdateInstitutionDto,
} from "./dto/institution-request.dto.js";
import { InstitutionDto, MemberDto, RemovedMemberDto } from "./dto/institution-response.dto.js";
import { InstitutionsService } from "./institutions.service.js";
import type { InstitutionView, MemberView, RemovedMemberView } from "./institutions.types.js";

const UNAUTHORIZED = { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." };
const NOT_FOUND = {
  status: HttpStatus.NOT_FOUND,
  description: "INSTITUTION_NOT_FOUND: unknown, archived, or not yours to see.",
};

@ApiTags("institutions")
@ApiBearerAuth()
@Controller("institutions")
export class InstitutionsController {
  constructor(private readonly institutions: InstitutionsService) {}

  @Post()
  @PlatformRoles("PLATFORM_ADMIN")
  @CustomMessage("Institution created")
  @ApiOperation({
    summary: "Create an institution",
    description: "Platform admins only. The institution starts active; invite its admin next.",
  })
  @ApiEnvelope({ status: HttpStatus.CREATED, description: "Created.", type: InstitutionDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED." },
    UNAUTHORIZED,
    { status: HttpStatus.FORBIDDEN, description: "INSUFFICIENT_ROLE: not a platform admin." },
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateInstitutionDto,
  ): Promise<InstitutionView> {
    return this.institutions.create(user, body);
  }

  @Get()
  @PlatformRoles("PLATFORM_ADMIN")
  @CustomMessage("Institutions loaded")
  @ApiOperation({ summary: "List institutions", description: "Platform admins only. Paginated." })
  @ApiEnvelope({
    status: HttpStatus.OK,
    description: "A page of institutions; see meta.pagination.",
    type: InstitutionDto,
    isArray: true,
  })
  @ApiErrors(UNAUTHORIZED, {
    status: HttpStatus.FORBIDDEN,
    description: "INSUFFICIENT_ROLE: not a platform admin.",
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InstitutionListQueryDto,
  ): Promise<PaginatedResult<InstitutionView>> {
    return this.institutions.list(user, query);
  }

  @Get(":institutionId")
  @CustomMessage("Institution loaded")
  @ApiOperation({
    summary: "Get an institution",
    description: "Platform admins, or any active member of the institution.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: InstitutionDto })
  @ApiErrors(UNAUTHORIZED, NOT_FOUND)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
  ): Promise<InstitutionView> {
    return this.institutions.findOne(user, institutionId);
  }

  @Get(":institutionId/members")
  @CustomMessage("Members loaded")
  @ApiOperation({
    summary: "The institution's active members",
    description:
      "Institution administrators and platform admins. Active memberships only: an " +
      "invited or suspended person cannot be enrolled.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: MemberDto, isArray: true })
  @ApiErrors(UNAUTHORIZED, NOT_FOUND)
  listMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
  ): Promise<MemberView[]> {
    return this.institutions.listMembers(user, institutionId);
  }

  @Post(":institutionId/members/:userId/remove")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Member removed")
  @ApiOperation({
    summary: "Remove someone from the institution",
    description:
      "Their membership becomes LEFT and their open cohort places here are withdrawn; " +
      "finished ones are kept, and so is their progress. Access ends at once. A fresh " +
      "invitation brings them back. The last administrator cannot be removed.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Removed.", type: RemovedMemberDto })
  @ApiErrors(
    UNAUTHORIZED,
    { status: HttpStatus.FORBIDDEN, description: "INSUFFICIENT_ROLE." },
    NOT_FOUND,
    { status: HttpStatus.CONFLICT, description: "LAST_ADMINISTRATOR." },
  )
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
  ): Promise<RemovedMemberView> {
    return this.institutions.removeMember(user, institutionId, userId);
  }

  @Patch(":institutionId")
  @CustomMessage("Institution updated")
  @ApiOperation({
    summary: "Update an institution",
    description:
      "Platform admins, or the institution's own admins. Only a platform admin can change " +
      "the type. The slug never changes.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Updated.", type: InstitutionDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED." },
    UNAUTHORIZED,
    { status: HttpStatus.FORBIDDEN, description: "INSUFFICIENT_ROLE." },
    NOT_FOUND,
  )
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Body() body: UpdateInstitutionDto,
  ): Promise<InstitutionView> {
    return this.institutions.update(user, institutionId, body);
  }
}
