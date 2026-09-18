import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import type { PaginatedResult } from "../../common/http/api-response.js";
import { InviteListQueryDto, IssueInviteDto } from "./dto/invite-request.dto.js";
import { InviteDto, IssuedInviteDto } from "./dto/invite-response.dto.js";
import { InvitesService } from "./invites.service.js";
import type { InviteView, IssuedInviteView } from "./invites.types.js";

const MANAGE_ERRORS = [
  { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." },
  { status: HttpStatus.FORBIDDEN, description: "INSUFFICIENT_ROLE: a member, but not an admin." },
  { status: HttpStatus.NOT_FOUND, description: "INSTITUTION_NOT_FOUND or INVITE_NOT_FOUND." },
];

/** Invitations as the institution manages them. Institution or platform admins only. */
@ApiTags("invites")
@ApiBearerAuth()
@Controller("institutions/:institutionId/invites")
export class InstitutionInvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Post()
  @CustomMessage("Invitation created")
  @ApiOperation({
    summary: "Invite someone to the institution",
    description:
      "Emails a single-use link. Replaces any pending invitation to the same email. " +
      "Check `emailStatus`: FAILED means the invitation exists but its email did not go.",
  })
  @ApiEnvelope({ status: HttpStatus.CREATED, description: "Created.", type: IssuedInviteDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED." },
    ...MANAGE_ERRORS,
    {
      status: HttpStatus.CONFLICT,
      description: "ALREADY_MEMBER, or INSTITUTION_UNAVAILABLE for a suspended institution.",
    },
  )
  issue(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Body() body: IssueInviteDto,
  ): Promise<IssuedInviteView> {
    return this.invites.issue(user, institutionId, body);
  }

  @Get()
  @CustomMessage("Invitations loaded")
  @ApiOperation({ summary: "List the institution's invitations", description: "Paginated, newest first." })
  @ApiEnvelope({
    status: HttpStatus.OK,
    description: "A page of invitations; see meta.pagination.",
    type: InviteDto,
    isArray: true,
  })
  @ApiErrors(...MANAGE_ERRORS)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Query() query: InviteListQueryDto,
  ): Promise<PaginatedResult<InviteView>> {
    return this.invites.list(user, institutionId, query);
  }

  @Post(":inviteId/resend")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Invitation reissued")
  @ApiOperation({
    summary: "Resend an invitation",
    description: "Issues a new link and expiry; the previous link stops working.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Reissued.", type: IssuedInviteDto })
  @ApiErrors(...MANAGE_ERRORS, {
    status: HttpStatus.CONFLICT,
    description: "INVITE_NOT_PENDING: already accepted or revoked.",
  })
  resend(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Param("inviteId", ParseUUIDPipe) inviteId: string,
  ): Promise<IssuedInviteView> {
    return this.invites.resend(user, institutionId, inviteId);
  }

  @Post(":inviteId/revoke")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Invitation revoked")
  @ApiOperation({ summary: "Withdraw an invitation", description: "Idempotent." })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Revoked.", type: InviteDto })
  @ApiErrors(...MANAGE_ERRORS, {
    status: HttpStatus.CONFLICT,
    description: "INVITE_ALREADY_ACCEPTED.",
  })
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param("institutionId", ParseUUIDPipe) institutionId: string,
    @Param("inviteId", ParseUUIDPipe) inviteId: string,
  ): Promise<InviteView> {
    return this.invites.revoke(user, institutionId, inviteId);
  }
}
