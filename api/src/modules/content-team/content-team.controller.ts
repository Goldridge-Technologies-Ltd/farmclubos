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
import { PlatformRoles } from "../../common/decorators/roles.decorator.js";
import { ContentTeamService } from "./content-team.service.js";
import type {
  ContentTeamInviteView,
  ContentTeamView,
  IssuedContentTeamInviteView,
  RemovedMemberView,
} from "./content-team.types.js";
import { InviteContentManagerDto } from "./dto/content-team-request.dto.js";
import {
  ContentTeamDto,
  ContentTeamInviteDto,
  IssuedContentTeamInviteDto,
  RemovedMemberDto,
} from "./dto/content-team-response.dto.js";

const UNAUTHORIZED = { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." };
const FORBIDDEN = {
  status: HttpStatus.FORBIDDEN,
  description: "INSUFFICIENT_ROLE: only platform administrators.",
};
const INVITE_NOT_FOUND = {
  status: HttpStatus.NOT_FOUND,
  description: "INVITE_NOT_FOUND, including an institution's invitation id.",
};

/*
  The content team, as a platform administrator runs it. The team builds the
  Academy for every institution and belongs to none, so nothing here takes an
  institution. Accepting an invitation is the invites module's.
*/
@ApiTags("content-team")
@ApiBearerAuth()
@PlatformRoles("PLATFORM_ADMIN")
@Controller("content-team")
export class ContentTeamController {
  constructor(private readonly team: ContentTeamService) {}

  @Get()
  @CustomMessage("Content team loaded")
  @ApiOperation({ summary: "Who is on the content team, and the invitations still open" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "The team.", type: ContentTeamDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN)
  list(@CurrentUser() user: AuthenticatedUser): Promise<ContentTeamView> {
    return this.team.list(user);
  }

  @Post("invites")
  @CustomMessage("Invitation sent")
  @ApiOperation({
    summary: "Invite a content manager",
    description:
      "Emails a single-use link. Replaces any open invitation to the same email. Check " +
      "`emailStatus`: FAILED means the invitation exists but its email did not go.",
  })
  @ApiEnvelope({ status: HttpStatus.CREATED, description: "Invited.", type: IssuedContentTeamInviteDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED." },
    UNAUTHORIZED,
    FORBIDDEN,
    { status: HttpStatus.CONFLICT, description: "ALREADY_CONTENT_TEAM." },
  )
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: InviteContentManagerDto,
  ): Promise<IssuedContentTeamInviteView> {
    return this.team.invite(user, body);
  }

  @Post("invites/:inviteId/resend")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Invitation sent again")
  @ApiOperation({ summary: "Send an invitation again, with a fresh link and expiry" })
  @ApiParam({ name: "inviteId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Sent.", type: IssuedContentTeamInviteDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, INVITE_NOT_FOUND, {
    status: HttpStatus.CONFLICT,
    description: "INVITE_NOT_PENDING: accepted or withdrawn.",
  })
  resend(
    @CurrentUser() user: AuthenticatedUser,
    @Param("inviteId", ParseUUIDPipe) inviteId: string,
  ): Promise<IssuedContentTeamInviteView> {
    return this.team.resend(user, inviteId);
  }

  @Post("invites/:inviteId/revoke")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Invitation withdrawn")
  @ApiOperation({ summary: "Withdraw an invitation. Withdrawing one twice is not an error." })
  @ApiParam({ name: "inviteId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Withdrawn.", type: ContentTeamInviteDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, INVITE_NOT_FOUND, {
    status: HttpStatus.CONFLICT,
    description: "INVITE_ALREADY_ACCEPTED.",
  })
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param("inviteId", ParseUUIDPipe) inviteId: string,
  ): Promise<ContentTeamInviteView> {
    return this.team.revoke(user, inviteId);
  }

  @Post("members/:userId/remove")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Removed from the content team")
  @ApiOperation({
    summary: "Take a content manager off the content team",
    description:
      "Their platform role goes back to none; their account, memberships and work stay. " +
      "Removing someone already off the team is not an error.",
  })
  @ApiParam({ name: "userId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Removed.", type: RemovedMemberDto })
  @ApiErrors(
    UNAUTHORIZED,
    FORBIDDEN,
    { status: HttpStatus.NOT_FOUND, description: "MEMBER_NOT_FOUND." },
    { status: HttpStatus.CONFLICT, description: "PLATFORM_ADMIN_ON_TEAM." },
  )
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId", ParseUUIDPipe) userId: string,
  ): Promise<RemovedMemberView> {
    return this.team.remove(user, userId);
  }
}
