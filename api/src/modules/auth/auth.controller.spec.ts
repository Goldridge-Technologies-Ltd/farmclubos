import { jest } from "@jest/globals";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { CUSTOM_MESSAGE_KEY } from "../../common/decorators/custom-message.decorator.js";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const user: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "ada@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "LEARNER",
};
const client = { userAgent: "jest", ipAddress: "127.0.0.1" };

describe("AuthController", () => {
  let controller: AuthController;
  let auth: Record<
    | "login"
    | "refresh"
    | "logout"
    | "getSessionContext"
    | "switchInstitution"
    | "requestPasswordReset"
    | "resetPassword",
    AsyncMock
  >;

  beforeEach(async () => {
    auth = {
      login: fn(),
      refresh: fn(),
      logout: fn(),
      getSessionContext: fn(),
      switchInstitution: fn(),
      requestPasswordReset: fn(),
      resetPassword: fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: auth }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it("delegates sign-in with the credentials and client details", async () => {
    auth.login.mockResolvedValue({ accessToken: "t" });
    const body = { email: "ada@example.com", password: "pw" };

    await expect(controller.login(body, client)).resolves.toEqual({ accessToken: "t" });
    expect(auth.login).toHaveBeenCalledWith(body, client);
  });

  it("delegates refresh with the token and client details", async () => {
    await controller.refresh({ refreshToken: "r".repeat(43) }, client);

    expect(auth.refresh).toHaveBeenCalledWith("r".repeat(43), client);
  });

  it("returns no data from sign-out, password-reset request and reset", async () => {
    await expect(controller.logout({ refreshToken: "r".repeat(43) })).resolves.toBeNull();
    await expect(controller.forgotPassword({ email: "ada@example.com" })).resolves.toBeNull();
    await expect(
      controller.resetPassword({ token: "t".repeat(43), password: "a long new passphrase" }),
    ).resolves.toBeNull();

    expect(auth.resetPassword).toHaveBeenCalledWith("t".repeat(43), "a long new passphrase");
  });

  it("delegates the session and institution switch for the signed-in user", async () => {
    await controller.me(user);
    await controller.switchInstitution(user, { institutionId: "institution-2" });

    expect(auth.getSessionContext).toHaveBeenCalledWith(user);
    expect(auth.switchInstitution).toHaveBeenCalledWith(user, "institution-2");
  });

  describe("route metadata", () => {
    const reflector = new Reflector();
    const handler = (name: keyof AuthController) =>
      AuthController.prototype[name] as (...args: unknown[]) => unknown;

    it.each(["login", "refresh", "logout", "forgotPassword", "resetPassword"] as const)(
      "marks %s public, since the caller has no access token yet",
      (name) => {
        expect(reflector.get(IS_PUBLIC_KEY, handler(name))).toBe(true);
      },
    );

    it.each(["me", "switchInstitution"] as const)("keeps %s behind sign-in", (name) => {
      expect(reflector.get(IS_PUBLIC_KEY, handler(name))).toBeUndefined();
    });

    it("gives a forgotten-password request a message that does not confirm the account", () => {
      expect(reflector.get(CUSTOM_MESSAGE_KEY, handler("forgotPassword"))).toBe(
        "If an account exists for that email, a link to reset its password is on its way.",
      );
    });
  });
});
