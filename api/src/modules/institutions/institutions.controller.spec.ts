import { jest } from "@jest/globals";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PLATFORM_ROLES_KEY } from "../../common/decorators/roles.decorator.js";
import { InstitutionsController } from "./institutions.controller.js";
import { InstitutionsService } from "./institutions.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const user: AuthenticatedUser = {
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.com",
  platformRole: "PLATFORM_ADMIN",
  institutionId: null,
  institutionRole: null,
};

describe("InstitutionsController", () => {
  let controller: InstitutionsController;
  const institutions = { create: fn(), list: fn(), findOne: fn(), update: fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [InstitutionsController],
      providers: [{ provide: InstitutionsService, useValue: institutions }],
    }).compile();

    controller = moduleRef.get(InstitutionsController);
  });

  it("delegates every route to the service with the signed-in user", async () => {
    const body = { name: "Greenfield", type: "UNIVERSITY" as const, contactEmail: "a@b.co" };
    const query = { page: 1, pageSize: 20 };

    await controller.create(user, body);
    await controller.list(user, query);
    await controller.findOne(user, "institution-1");
    await controller.update(user, "institution-1", { city: "North Campus" });

    expect(institutions.create).toHaveBeenCalledWith(user, body);
    expect(institutions.list).toHaveBeenCalledWith(user, query);
    expect(institutions.findOne).toHaveBeenCalledWith(user, "institution-1");
    expect(institutions.update).toHaveBeenCalledWith(user, "institution-1", { city: "North Campus" });
  });

  it("restricts creating and listing to platform admins at the route", () => {
    const reflector = new Reflector();
    const rolesFor = (name: keyof InstitutionsController) =>
      reflector.get<string[]>(
        PLATFORM_ROLES_KEY,
        InstitutionsController.prototype[name] as () => unknown,
      );

    expect(rolesFor("create")).toEqual(["PLATFORM_ADMIN"]);
    expect(rolesFor("list")).toEqual(["PLATFORM_ADMIN"]);
    // Members reach these too; the service decides per institution.
    expect(rolesFor("findOne")).toBeUndefined();
    expect(rolesFor("update")).toBeUndefined();
  });
});
