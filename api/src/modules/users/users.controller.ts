import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { ChangePasswordDto, UpdateProfileDto } from "./dto/user-request.dto.js";
import { ProfileDto } from "./dto/user-response.dto.js";
import { UsersService } from "./users.service.js";
import type { ProfileView } from "./users.types.js";

const UNAUTHORIZED = { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." };

/** The signed-in user's own account. There is no route to another user's. */
@ApiTags("users")
@ApiBearerAuth()
@Controller("users/me")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @CustomMessage("Profile loaded")
  @ApiOperation({ summary: "Your profile", description: "Includes learner details for learners." })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: ProfileDto })
  @ApiErrors(UNAUTHORIZED)
  getProfile(@CurrentUser() user: AuthenticatedUser): Promise<ProfileView> {
    return this.users.getProfile(user);
  }

  @Patch()
  @CustomMessage("Profile updated")
  @ApiOperation({
    summary: "Update your profile",
    description:
      "Send only the fields to change; `null` clears an optional learner detail. A " +
      "learner's state is set by their institution and cannot be changed here.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Updated.", type: ProfileDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED or NOT_A_LEARNER." },
    UNAUTHORIZED,
  )
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ): Promise<ProfileView> {
    return this.users.updateProfile(user, body);
  }

  @Post("password")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Password changed. Your other devices have been signed out.")
  @ApiOperation({
    summary: "Change your password",
    description:
      "Keeps this device signed in and signs out every other session. A wrong current " +
      "password is a 400, not a 401, so it never looks like an expired session.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Changed." })
  @ApiErrors(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "VALIDATION_FAILED, CURRENT_PASSWORD_INCORRECT or PASSWORD_UNCHANGED.",
    },
    UNAUTHORIZED,
  )
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangePasswordDto,
  ): Promise<null> {
    await this.users.changePassword(user, body);
    return null;
  }
}
