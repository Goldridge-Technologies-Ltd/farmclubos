import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { ClientContext } from "../../common/auth/client-context.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { ClientInfo } from "../../common/decorators/client-info.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { Public } from "../../common/decorators/public.decorator.js";
import type { AuthSessionResult, MembershipSummary } from "../auth/auth.types.js";
import { AuthSessionDto, MembershipSummaryDto } from "../auth/dto/auth-response.dto.js";
import { AcceptInviteDto, InviteTokenDto } from "./dto/invite-request.dto.js";
import { InviteLookupDto } from "./dto/invite-response.dto.js";
import { InvitesService } from "./invites.service.js";
import type { InviteLookupView } from "./invites.types.js";

const UNUSABLE = [
  { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED." },
  { status: HttpStatus.NOT_FOUND, description: "INVITE_NOT_FOUND." },
  { status: HttpStatus.CONFLICT, description: "INVITE_ALREADY_ACCEPTED." },
  {
    status: HttpStatus.GONE,
    description: "INVITE_REVOKED, INVITE_EXPIRED or INSTITUTION_UNAVAILABLE.",
  },
];

/*
  Invitations as the invitee uses them. The token travels in the body, never
  the URL, so it stays out of access logs.
*/
@ApiTags("invites")
@Controller("invites")
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Public()
  @Post("lookup")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Invitation found")
  @ApiOperation({
    summary: "Describe an invitation before accepting it",
    description: "`accountExists` tells the page whether to offer sign-up or sign-in.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Usable.", type: InviteLookupDto })
  @ApiErrors(...UNUSABLE)
  lookup(@Body() body: InviteTokenDto): Promise<InviteLookupView> {
    return this.invites.lookup(body.token);
  }

  @Public()
  @Post("accept")
  @CustomMessage("Invitation accepted")
  @ApiOperation({
    summary: "Accept an invitation by creating an account",
    description: "For an email with no account yet. Signs the new account in.",
  })
  @ApiEnvelope({
    status: HttpStatus.CREATED,
    description: "Account created and signed in.",
    type: AuthSessionDto,
  })
  @ApiErrors(...UNUSABLE, {
    status: HttpStatus.CONFLICT,
    description: "ACCOUNT_EXISTS: sign in, then use /invites/join.",
  })
  accept(
    @Body() body: AcceptInviteDto,
    @ClientInfo() client: ClientContext,
  ): Promise<AuthSessionResult> {
    return this.invites.accept(body, client);
  }

  @Post("join")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @CustomMessage("Invitation accepted")
  @ApiOperation({
    summary: "Accept an invitation with an existing account",
    description:
      "The signed-in account's email must match the invitation. Switch to the institution " +
      "with /auth/switch-institution afterwards.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Joined.", type: MembershipSummaryDto })
  @ApiErrors(
    ...UNUSABLE,
    { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." },
    { status: HttpStatus.CONFLICT, description: "ALREADY_MEMBER." },
  )
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: InviteTokenDto,
  ): Promise<MembershipSummary> {
    return this.invites.join(user, body.token);
  }
}
