import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { CohortsController } from "./cohorts.controller.js";
import { CohortsService } from "./cohorts.service.js";

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

describe("CohortsController", () => {
  let controller: CohortsController;
  const cohorts = { listMine: fn(), getMine: fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [CohortsController],
      providers: [{ provide: CohortsService, useValue: cohorts }],
    }).compile();

    controller = moduleRef.get(CohortsController);
  });

  it("asks the service for the caller's own enrolments", async () => {
    cohorts.listMine.mockResolvedValue([]);

    await controller.listMine(user);

    // The caller comes from the token, never from the path: a userId in the
    // URL would be a route to someone else's enrolments.
    expect(cohorts.listMine).toHaveBeenCalledWith(user);
  });

  it("passes the caller alongside the enrolment id", async () => {
    cohorts.getMine.mockResolvedValue({});

    await controller.getMine(user, "enrolment-1");

    expect(cohorts.getMine).toHaveBeenCalledWith(user, "enrolment-1");
  });
});
