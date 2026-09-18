import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import {
  ACCESS_TOKEN_ALGORITHM,
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  toAuthenticatedUser,
  type AccessTokenClaims,
} from "../auth/access-token.js";
import type { AuthenticatedRequest } from "../auth/authenticated-user.js";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";

/**
 * Registered globally, so every route needs a valid bearer access token unless
 * it is marked @Public(). Verification is stateless: signature, algorithm,
 * issuer, audience and expiry, with no database round trip.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException({
        code: "AUTHENTICATION_REQUIRED",
        message: "Sign in to continue.",
      });
    }

    try {
      const claims = await this.jwt.verifyAsync<AccessTokenClaims>(token, {
        algorithms: [ACCESS_TOKEN_ALGORITHM],
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      });

      request.user = toAuthenticatedUser(claims);

      return true;
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_ACCESS_TOKEN",
        message: "Your session has expired. Sign in again.",
      });
    }
  }
}

function readBearerToken(header: string | undefined): string | null {
  const [scheme, token] = header?.split(" ") ?? [];

  return scheme === "Bearer" && token ? token : null;
}
