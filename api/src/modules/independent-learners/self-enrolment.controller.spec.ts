import { jest } from "@jest/globals";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator.js";
import { SelfEnrolmentController } from "./self-enrolment.controller.js";
import { SelfEnrolmentService } from "./self-enrolment.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const user: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "ada@example.com",
  platformRole: "NONE",
  institutionId: null,
  institutionRole: null,
};

describe("SelfEnrolmentController", () => {
  let controller: SelfEnrolmentController;
  let enrolments: { start: AsyncMock };

  beforeEach(async () => {
    enrolments = { start: fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [SelfEnrolmentController],
      providers: [{ provide: SelfEnrolmentService, useValue: enrolments }],
    }).compile();

    controller = moduleRef.get(SelfEnrolmentController);
  });

  it("starts the pathway in the path for the caller", async () => {
    enrolments.start.mockResolvedValue({ enrolmentId: "enrolment-1" });

    await expect(controller.start(user, "foundation")).resolves.toEqual({
      enrolmentId: "enrolment-1",
    });
    expect(enrolments.start).toHaveBeenCalledWith(user, "foundation");
  });

  it("needs a session: it records progress against an account", () => {
    const handler = SelfEnrolmentController.prototype.start as (...args: unknown[]) => unknown;

    expect(new Reflector().get(IS_PUBLIC_KEY, handler)).toBeUndefined();
  });
});
