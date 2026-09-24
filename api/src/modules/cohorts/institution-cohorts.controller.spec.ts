import { jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { InstitutionAccessService } from "../institutions/institution-access.service.js";
import { CohortsService } from "./cohorts.service.js";
import { InstitutionCohortsController } from "./institution-cohorts.controller.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const admin: AuthenticatedUser = {
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "INSTITUTION_ADMIN",
};

/*
  The route names an institution in its path, which the token's role cannot
  vouch for — so every action checks access to *that* institution first, and
  does nothing when the check fails.
*/
describe("InstitutionCohortsController", () => {
  let controller: InstitutionCohortsController;
  const cohorts = {
    listForInstitution: fn(),
    getForInstitution: fn(),
    createCohort: fn(),
    enrol: fn(),
  };
  const access = { assertCanManage: fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [InstitutionCohortsController],
      providers: [
        { provide: CohortsService, useValue: cohorts },
        { provide: InstitutionAccessService, useValue: access },
      ],
    }).compile();

    controller = moduleRef.get(InstitutionCohortsController);
  });

  it("checks access to the institution in the path before every action", async () => {
    access.assertCanManage.mockRejectedValue(new ForbiddenException());

    await expect(controller.listCohorts(admin, "institution-2")).rejects.toThrow(ForbiddenException);
    await expect(controller.getCohort(admin, "institution-2", "cohort-1")).rejects.toThrow(
      ForbiddenException,
    );
    await expect(
      controller.createCohort(admin, "institution-2", { pathwaySlug: "p", name: "n" }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      controller.enrol(admin, "institution-2", "cohort-1", { email: "a@example.com" }),
    ).rejects.toThrow(ForbiddenException);

    expect(access.assertCanManage).toHaveBeenCalledWith(admin, "institution-2");
    expect(cohorts.listForInstitution).not.toHaveBeenCalled();
    expect(cohorts.getForInstitution).not.toHaveBeenCalled();
    expect(cohorts.createCohort).not.toHaveBeenCalled();
    expect(cohorts.enrol).not.toHaveBeenCalled();
  });

  it("scopes every read and write to the institution in the path", async () => {
    access.assertCanManage.mockResolvedValue({});
    for (const call of Object.values(cohorts)) {
      call.mockResolvedValue({});
    }

    await controller.listCohorts(admin, "institution-1");
    await controller.getCohort(admin, "institution-1", "cohort-1");

    expect(cohorts.listForInstitution).toHaveBeenCalledWith("institution-1");
    expect(cohorts.getForInstitution).toHaveBeenCalledWith("institution-1", "cohort-1");
  });
});
