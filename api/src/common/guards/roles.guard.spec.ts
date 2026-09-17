import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from "../auth/authenticated-user.js";
import { InstitutionRoles, PlatformRoles } from "../decorators/roles.decorator.js";
import { RolesGuard } from "./roles.guard.js";

class Handlers {
  unrestricted(): void {}

  @PlatformRoles("PLATFORM_ADMIN")
  platformOnly(): void {}

  @InstitutionRoles("INSTITUTION_ADMIN")
  institutionAdminOnly(): void {}

  @PlatformRoles("PLATFORM_ADMIN")
  @InstitutionRoles("INSTITUTION_ADMIN")
  eitherAdmin(): void {}
}

const learner: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "learner@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "LEARNER",
};

function contextFor(handler: () => void, user?: AuthenticatedUser): ExecutionContext {
  const request = { user } as AuthenticatedRequest;

  return {
    getHandler: () => handler,
    getClass: () => Handlers,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  const guard = new RolesGuard(new Reflector());

  it("allows any signed-in user when no role is required", () => {
    expect(guard.canActivate(contextFor(Handlers.prototype.unrestricted, learner))).toBe(true);
  });

  it("allows a platform admin on a platform-only route", () => {
    const admin = { ...learner, platformRole: "PLATFORM_ADMIN" as const };

    expect(guard.canActivate(contextFor(Handlers.prototype.platformOnly, admin))).toBe(true);
  });

  it("forbids a learner on a platform-only route", () => {
    expect(() =>
      guard.canActivate(contextFor(Handlers.prototype.platformOnly, learner)),
    ).toThrow(ForbiddenException);
  });

  it("allows an institution admin by their active institution role", () => {
    const admin = { ...learner, institutionRole: "INSTITUTION_ADMIN" as const };

    expect(
      guard.canActivate(contextFor(Handlers.prototype.institutionAdminOnly, admin)),
    ).toBe(true);
  });

  it("forbids a user with no active institution on an institution route", () => {
    const unaffiliated = { ...learner, institutionId: null, institutionRole: null };

    expect(() =>
      guard.canActivate(contextFor(Handlers.prototype.institutionAdminOnly, unaffiliated)),
    ).toThrow(ForbiddenException);
  });

  it("allows either role when a route lists both", () => {
    const platformAdmin = { ...learner, platformRole: "PLATFORM_ADMIN" as const };
    const institutionAdmin = { ...learner, institutionRole: "INSTITUTION_ADMIN" as const };

    expect(guard.canActivate(contextFor(Handlers.prototype.eitherAdmin, platformAdmin))).toBe(true);
    expect(guard.canActivate(contextFor(Handlers.prototype.eitherAdmin, institutionAdmin))).toBe(true);
  });

  it("rejects a role-restricted route that has no authenticated user", () => {
    expect(() => guard.canActivate(contextFor(Handlers.prototype.platformOnly))).toThrow(
      UnauthorizedException,
    );
  });
});
