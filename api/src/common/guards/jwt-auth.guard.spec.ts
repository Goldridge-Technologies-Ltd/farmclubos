import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  type AccessTokenClaims,
} from "../auth/access-token.js";
import type { AuthenticatedRequest } from "../auth/authenticated-user.js";
import { Public } from "../decorators/public.decorator.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

const SECRET = "test-access-secret-that-is-long-enough";

class Handlers {
  @Public()
  open(): void {}

  guarded(): void {}
}

function contextFor(
  handler: () => void,
  authorization?: string,
): { context: ExecutionContext; request: AuthenticatedRequest } {
  const request = { headers: { authorization } } as unknown as AuthenticatedRequest;

  const context = {
    getHandler: () => handler,
    getClass: () => Handlers,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { context, request };
}

const claims: AccessTokenClaims = {
  sub: "user-1",
  sid: "session-1",
  email: "ada@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "INSTITUTION_ADMIN",
};

describe("JwtAuthGuard", () => {
  const jwt = new JwtService({ secret: SECRET });
  const guard = new JwtAuthGuard(new Reflector(), jwt);

  const sign = (overrides: Record<string, unknown> = {}) =>
    jwt.signAsync(claims, {
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
      algorithm: "HS256",
      expiresIn: 60,
      ...overrides,
    });

  it("lets a @Public() route through without a token", async () => {
    const { context } = contextFor(Handlers.prototype.open);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("rejects a guarded route with no Authorization header", async () => {
    const { context } = contextFor(Handlers.prototype.guarded);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects a header that is not a bearer token", async () => {
    const { context } = contextFor(Handlers.prototype.guarded, "Basic abc");

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("attaches the authenticated user from a valid token", async () => {
    const { context, request } = contextFor(
      Handlers.prototype.guarded,
      `Bearer ${await sign()}`,
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      userId: "user-1",
      sessionId: "session-1",
      email: "ada@example.com",
      platformRole: "NONE",
      institutionId: "institution-1",
      institutionRole: "INSTITUTION_ADMIN",
    });
  });

  it("rejects a token signed with another secret", async () => {
    const forged = await new JwtService({ secret: "a-different-secret-entirely-32ch" }).signAsync(
      claims,
      { issuer: ACCESS_TOKEN_ISSUER, audience: ACCESS_TOKEN_AUDIENCE, algorithm: "HS256" },
    );
    const { context } = contextFor(Handlers.prototype.guarded, `Bearer ${forged}`);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects an expired token", async () => {
    const { context } = contextFor(
      Handlers.prototype.guarded,
      `Bearer ${await sign({ expiresIn: -10 })}`,
    );

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects a token issued for a different audience", async () => {
    const { context } = contextFor(
      Handlers.prototype.guarded,
      `Bearer ${await sign({ audience: "some-other-service" })}`,
    );

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
