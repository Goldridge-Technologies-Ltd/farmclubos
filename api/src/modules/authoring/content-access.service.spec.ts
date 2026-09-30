import { jest } from "@jest/globals";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { PrismaService } from "../../lib/database/prisma.service.js";
import { ContentAccessService } from "./content-access.service.js";

const caller: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "writer@example.com",
  platformRole: "CONTENT_MANAGER",
  institutionId: null,
  institutionRole: null,
};

/*
  The token's role can be fifteen minutes old. Taking someone off the content
  team must stop them editing the Academy now, so the role is read from the
  database every time.
*/
describe("ContentAccessService", () => {
  const findUnique = jest.fn<(args: unknown) => Promise<unknown>>();
  const access = new ContentAccessService({ user: { findUnique } } as unknown as PrismaService);

  it.each(["PLATFORM_ADMIN", "CONTENT_MANAGER"])("lets a %s author", async (platformRole) => {
    findUnique.mockResolvedValue({ platformRole, deactivatedAt: null });

    await expect(access.assertCanAuthor(caller)).resolves.toBeUndefined();
  });

  it("refuses anyone else, whatever their token says", async () => {
    findUnique.mockResolvedValue({ platformRole: "NONE", deactivatedAt: null });

    await expect(access.assertCanAuthor(caller)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("refuses a deactivated account as signed out", async () => {
    findUnique.mockResolvedValue({ platformRole: "CONTENT_MANAGER", deactivatedAt: new Date() });

    await expect(access.assertCanAuthor(caller)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
