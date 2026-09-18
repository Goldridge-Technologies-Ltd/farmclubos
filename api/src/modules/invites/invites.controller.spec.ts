import { jest } from "@jest/globals";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator.js";
import { InstitutionInvitesController } from "./institution-invites.controller.js";
import { InvitesController } from "./invites.controller.js";
import { InvitesService } from "./invites.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const user: AuthenticatedUser = {
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "INSTITUTION_ADMIN",
};

describe("Invite controllers", () => {
  let managing: InstitutionInvitesController;
  let invitee: InvitesController;
  const invites = {
    issue: fn(), list: fn(), resend: fn(), revoke: fn(),
    lookup: fn(), accept: fn(), join: fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [InstitutionInvitesController, InvitesController],
      providers: [{ provide: InvitesService, useValue: invites }],
    }).compile();

    managing = moduleRef.get(InstitutionInvitesController);
    invitee = moduleRef.get(InvitesController);
  });

  it("scopes every management route to the institution in the path", async () => {
    const body = { email: "learner@example.com", role: "LEARNER" as const };
    const query = { page: 1, pageSize: 20 };

    await managing.issue(user, "institution-1", body);
    await managing.list(user, "institution-1", query);
    await managing.resend(user, "institution-1", "invite-1");
    await managing.revoke(user, "institution-1", "invite-1");

    expect(invites.issue).toHaveBeenCalledWith(user, "institution-1", body);
    expect(invites.list).toHaveBeenCalledWith(user, "institution-1", query);
    expect(invites.resend).toHaveBeenCalledWith(user, "institution-1", "invite-1");
    expect(invites.revoke).toHaveBeenCalledWith(user, "institution-1", "invite-1");
  });

  it("delegates the invitee's routes", async () => {
    const client = { userAgent: "jest" };
    const accept = { token: "t".repeat(43), firstName: "Tunde", lastName: "Bello", password: "a long passphrase" };

    await invitee.lookup({ token: "t".repeat(43) });
    await invitee.accept(accept, client);
    await invitee.join(user, { token: "t".repeat(43) });

    expect(invites.lookup).toHaveBeenCalledWith("t".repeat(43));
    expect(invites.accept).toHaveBeenCalledWith(accept, client);
    expect(invites.join).toHaveBeenCalledWith(user, "t".repeat(43));
  });

  it("opens only lookup and accept to callers with no account", () => {
    const reflector = new Reflector();
    const isPublic = (handler: (...args: never[]) => unknown) => reflector.get(IS_PUBLIC_KEY, handler) === true;

    expect(isPublic(InvitesController.prototype.lookup)).toBe(true);
    expect(isPublic(InvitesController.prototype.accept)).toBe(true);
    expect(isPublic(InvitesController.prototype.join)).toBe(false);
    expect(isPublic(InstitutionInvitesController.prototype.issue)).toBe(false);
  });
});
