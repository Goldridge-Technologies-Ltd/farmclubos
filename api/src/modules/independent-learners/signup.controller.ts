import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { ClientContext } from "../../common/auth/client-context.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { ClientInfo } from "../../common/decorators/client-info.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { Public } from "../../common/decorators/public.decorator.js";
import { SignupDto } from "./dto/signup-request.dto.js";
import { SignupService } from "./signup.service.js";

/*
  Signing up on one's own, without an institution's invitation. The rest of
  becoming an independent learner happens on the invitation pages — the
  emailed link opens one — and starting a pathway in the Academy.
*/
@ApiTags("auth")
@Controller("auth")
export class SignupController {
  constructor(private readonly signups: SignupService) {}

  @Public()
  @Post("signup")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Check your email for a link to finish creating your account.")
  @ApiOperation({
    summary: "Sign up as an independent learner",
    description:
      "Emails a link to finish creating the account. Answers identically whether or not the " +
      "address already has one — that address is emailed a way to sign in instead — so it " +
      "cannot be used to find out who is registered.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Request accepted." })
  @ApiErrors(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "VALIDATION_FAILED: the body did not pass validation.",
    },
    {
      status: HttpStatus.TOO_MANY_REQUESTS,
      description:
        "TOO_MANY_ATTEMPTS: too many sign-ups for this address. `Retry-After` and " +
        "`error.details.retryAfterSeconds` say how long to wait.",
    },
  )
  async signUp(@Body() body: SignupDto, @ClientInfo() client: ClientContext): Promise<null> {
    await this.signups.signUp(body.email, client);
    return null;
  }
}
