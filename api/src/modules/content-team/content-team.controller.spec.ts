import { jest } from "@jest/globals";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PLATFORM_ROLES_KEY } from "../../common/decorators/roles.decorator.js";
import { ContentTeamController } from "./content-team.controller.js";
import { ContentTeamService } from "./content-team.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const user: AuthenticatedUser = {
  userId: "admin-1",
  sessionId: "session-1",
  email: "pat@example.com",
  platformRole: "PLATFORM_ADMIN",
  institutionId: null,
  institutionRole: null,
};

describe("ContentTeamController", () => {
  let controller: ContentTeamController;
  const team = { list: fn(), invite: fn(), resend: fn(), revoke: fn(), remove: fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ContentTeamController],
      providers: [{ provide: ContentTeamService, useValue: team }],
    }).compile();

    controller = moduleRef.get(ContentTeamController);
  });

  it("is for platform administrators, a coarse check the service repeats against the database", () => {
    expect(new Reflector().get(PLATFORM_ROLES_KEY, ContentTeamController)).toEqual(["PLATFORM_ADMIN"]);
  });

  it("hands each route to the service with the caller", async () => {
    const body = { email: "maker@example.com" };

    await controller.list(user);
    await controller.invite(user, body);
    await controller.resend(user, "invite-1");
    await controller.revoke(user, "invite-1");
    await controller.remove(user, "user-2");

    expect(team.list).toHaveBeenCalledWith(user);
    expect(team.invite).toHaveBeenCalledWith(user, body);
    expect(team.resend).toHaveBeenCalledWith(user, "invite-1");
    expect(team.revoke).toHaveBeenCalledWith(user, "invite-1");
    expect(team.remove).toHaveBeenCalledWith(user, "user-2");
  });
});
