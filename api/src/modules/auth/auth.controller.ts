import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { ClientContext } from "../../common/auth/client-context.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { ClientInfo } from "../../common/decorators/client-info.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { AuthService } from "./auth.service.js";
import type {
  AuthSessionResult,
  SessionContext,
  SwitchedInstitution,
} from "./auth.types.js";
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SwitchInstitutionDto,
} from "./dto/auth-request.dto.js";
import {
  AuthSessionDto,
  SessionContextDto,
  SwitchedInstitutionDto,
} from "./dto/auth-response.dto.js";

const VALIDATION_FAILED = {
  status: HttpStatus.BAD_REQUEST,
  description: "VALIDATION_FAILED: the body did not pass validation.",
};

const TOO_MANY_ATTEMPTS = {
  status: HttpStatus.TOO_MANY_REQUESTS,
  description:
    "TOO_MANY_ATTEMPTS: too many attempts for this account. `Retry-After` and " +
    "`error.details.retryAfterSeconds` say how long to wait.",
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Signed in")
  @ApiOperation({
    summary: "Sign in with email and password",
    description: "Starts a new session and returns an access token and a refresh token.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Signed in.", type: AuthSessionDto })
  @ApiErrors(
    VALIDATION_FAILED,
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "INVALID_CREDENTIALS, or ACCOUNT_DEACTIVATED once the password is proven.",
    },
    TOO_MANY_ATTEMPTS,
  )
  login(@Body() body: LoginDto, @ClientInfo() client: ClientContext): Promise<AuthSessionResult> {
    return this.auth.login(body, client);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Session refreshed")
  @ApiOperation({
    summary: "Exchange a refresh token for a new token pair",
    description:
      "The refresh token rotates: use the new one next time. Presenting a rotated token " +
      "again, outside a short grace window, is treated as theft and ends the session.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Tokens rotated.", type: AuthSessionDto })
  @ApiErrors(VALIDATION_FAILED, {
    status: HttpStatus.UNAUTHORIZED,
    description:
      "INVALID_REFRESH_TOKEN, REFRESH_TOKEN_EXPIRED, REFRESH_TOKEN_REUSED or ACCOUNT_DEACTIVATED.",
  })
  refresh(
    @Body() body: RefreshTokenDto,
    @ClientInfo() client: ClientContext,
  ): Promise<AuthSessionResult> {
    return this.auth.refresh(body.refreshToken, client);
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Signed out")
  @ApiOperation({
    summary: "Sign out",
    description:
      "Ends the session and every token rotated from it. Succeeds for an unknown token, " +
      "so it needs no access token and works after one has expired.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Signed out." })
  @ApiErrors(VALIDATION_FAILED)
  async logout(@Body() body: RefreshTokenDto): Promise<null> {
    await this.auth.logout(body.refreshToken);
    return null;
  }

  @Get("me")
  @ApiBearerAuth()
  @CustomMessage("Session loaded")
  @ApiOperation({
    summary: "The signed-in user and their institutions",
    description: "Read from the database, so a membership suspended since sign-in is gone.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Session loaded.", type: SessionContextDto })
  @ApiErrors({ status: HttpStatus.UNAUTHORIZED, description: "No valid access token." })
  me(@CurrentUser() user: AuthenticatedUser): Promise<SessionContext> {
    return this.auth.getSessionContext(user);
  }

  @Post("switch-institution")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @CustomMessage("Institution switched")
  @ApiOperation({
    summary: "Work in another institution you belong to",
    description:
      "Returns a new access token scoped to that institution. The refresh token is " +
      "unchanged, and later refreshes stay in the chosen institution.",
  })
  @ApiEnvelope({
    status: HttpStatus.OK,
    description: "Institution switched.",
    type: SwitchedInstitutionDto,
  })
  @ApiErrors(
    VALIDATION_FAILED,
    { status: HttpStatus.UNAUTHORIZED, description: "No valid access token, or the session ended." },
    { status: HttpStatus.NOT_FOUND, description: "INSTITUTION_NOT_FOUND: not a member." },
  )
  switchInstitution(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SwitchInstitutionDto,
  ): Promise<SwitchedInstitution> {
    return this.auth.switchInstitution(user, body.institutionId);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @CustomMessage(
    "If an account exists for that email, a link to reset its password is on its way.",
  )
  @ApiOperation({
    summary: "Request a password reset link",
    description:
      "Answers identically whether or not the account exists, so it cannot be used to " +
      "find out who is registered.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Request accepted." })
  @ApiErrors(VALIDATION_FAILED, TOO_MANY_ATTEMPTS)
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
    @ClientInfo() client: ClientContext,
  ): Promise<null> {
    await this.auth.requestPasswordReset(body.email, client);
    return null;
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Password reset. Sign in with your new password.")
  @ApiOperation({
    summary: "Choose a new password with a reset token",
    description: "Signs the account out on every device and emails a confirmation.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Password reset." })
  @ApiErrors(VALIDATION_FAILED, {
    status: HttpStatus.GONE,
    description: "RESET_TOKEN_INVALID: unknown, already used or expired.",
  })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<null> {
    await this.auth.resetPassword(body.token, body.password);
    return null;
  }
}
