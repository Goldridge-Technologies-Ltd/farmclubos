import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { InstitutionRole, PlatformRole } from "../../generated/prisma/enums.js";
import type { AuthenticatedRequest } from "../auth/authenticated-user.js";
import {
  INSTITUTION_ROLES_KEY,
  PLATFORM_ROLES_KEY,
} from "../decorators/roles.decorator.js";

/**
 * Coarse, role-level authorisation from @PlatformRoles and @InstitutionRoles.
 * Runs after JwtAuthGuard. Whether a user may touch a *particular* record —
 * this institution, that enrolment — is decided in the service, not here.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const platformRoles =
      this.reflector.getAllAndOverride<PlatformRole[]>(PLATFORM_ROLES_KEY, targets) ?? [];
    const institutionRoles =
      this.reflector.getAllAndOverride<InstitutionRole[]>(INSTITUTION_ROLES_KEY, targets) ??
      [];

    if (platformRoles.length === 0 && institutionRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!user) {
      throw new UnauthorizedException({
        code: "AUTHENTICATION_REQUIRED",
        message: "Sign in to continue.",
      });
    }

    const hasPlatformRole = platformRoles.includes(user.platformRole);
    const hasInstitutionRole =
      user.institutionRole !== null && institutionRoles.includes(user.institutionRole);

    if (hasPlatformRole || hasInstitutionRole) {
      return true;
    }

    throw new ForbiddenException({
      code: "INSUFFICIENT_ROLE",
      message: "You do not have permission to do this.",
    });
  }
}
