import {
  createParamDecorator,
  UnauthorizedException,
  type ExecutionContext,
} from "@nestjs/common";
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from "../auth/authenticated-user.js";

/** The user JwtAuthGuard established for this request. */
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Only reachable if @CurrentUser() is used on a @Public() route.
    if (!request.user) {
      throw new UnauthorizedException({
        code: "AUTHENTICATION_REQUIRED",
        message: "Sign in to continue.",
      });
    }

    return request.user;
  },
);
