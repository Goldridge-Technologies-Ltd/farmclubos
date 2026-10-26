import { jest } from "@jest/globals";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { CUSTOM_MESSAGE_KEY } from "../../common/decorators/custom-message.decorator.js";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator.js";
import { SignupController } from "./signup.controller.js";
import { SignupService } from "./signup.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

describe("SignupController", () => {
  let controller: SignupController;
  let signups: { signUp: AsyncMock };

  beforeEach(async () => {
    signups = { signUp: fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [SignupController],
      providers: [{ provide: SignupService, useValue: signups }],
    }).compile();

    controller = moduleRef.get(SignupController);
  });

  it("hands the email and the caller's details on, and returns nothing to tell", async () => {
    const client = { userAgent: "jest", forwardedFor: "203.0.113.5" };

    await expect(controller.signUp({ email: "newcomer@example.com" }, client)).resolves.toBeNull();
    expect(signups.signUp).toHaveBeenCalledWith("newcomer@example.com", client);
  });

  describe("route metadata", () => {
    const reflector = new Reflector();
    const handler = SignupController.prototype.signUp as (...args: unknown[]) => unknown;

    it("is public, since the caller has no account yet", () => {
      expect(reflector.get(IS_PUBLIC_KEY, handler)).toBe(true);
    });

    it("answers in words that do not say whether the address has an account", () => {
      expect(reflector.get(CUSTOM_MESSAGE_KEY, handler)).toBe(
        "Check your email for a link to finish creating your account.",
      );
    });
  });
});
