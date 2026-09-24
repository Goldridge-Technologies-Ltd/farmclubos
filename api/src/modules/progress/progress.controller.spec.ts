import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ProgressController } from "./progress.controller.js";
import { ProgressService } from "./progress.service.js";

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

describe("ProgressController", () => {
  let controller: ProgressController;
  const progress = { myJourney: fn(), completeLesson: fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [{ provide: ProgressService, useValue: progress }],
    }).compile();

    controller = moduleRef.get(ProgressController);
  });

  it("reads the journey for the caller in the token", async () => {
    progress.myJourney.mockResolvedValue([]);

    await controller.myJourney(user);

    expect(progress.myJourney).toHaveBeenCalledWith(user);
  });

  it("takes the lesson from the body and the learner from the token", async () => {
    progress.completeLesson.mockResolvedValue({});

    await controller.completeLesson(user, { lessonId: "lesson-1" });

    // A learner id in the body would be a route to writing someone else's
    // progress; there is deliberately no such parameter.
    expect(progress.completeLesson).toHaveBeenCalledWith(user, "lesson-1");
  });
});
