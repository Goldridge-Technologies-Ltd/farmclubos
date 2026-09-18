import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const user: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "tunde@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "LEARNER",
};

describe("UsersController", () => {
  let controller: UsersController;
  const users = { getProfile: fn(), updateProfile: fn(), changePassword: fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: users }],
    }).compile();

    controller = moduleRef.get(UsersController);
  });

  it("only ever acts on the signed-in user", async () => {
    const update = { firstName: "Babatunde" };
    const change = { currentPassword: "old long passphrase", newPassword: "a new long passphrase" };

    await controller.getProfile(user);
    await controller.updateProfile(user, update);
    await expect(controller.changePassword(user, change)).resolves.toBeNull();

    expect(users.getProfile).toHaveBeenCalledWith(user);
    expect(users.updateProfile).toHaveBeenCalledWith(user, update);
    expect(users.changePassword).toHaveBeenCalledWith(user, change);
  });
});
