import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { AssessmentsController } from "./assessments.controller.js";
import { AssessmentsService } from "./assessments.service.js";

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

describe("AssessmentsController", () => {
  let controller: AssessmentsController;
  const assessments = {
    getAssessment: fn(),
    startAttempt: fn(),
    getAttempt: fn(),
    saveAnswers: fn(),
    submitAttempt: fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [AssessmentsController],
      providers: [{ provide: AssessmentsService, useValue: assessments }],
    }).compile();

    controller = moduleRef.get(AssessmentsController);
  });

  it("passes the caller with every id, so nothing is reachable by id alone", async () => {
    for (const call of Object.values(assessments)) {
      call.mockResolvedValue({});
    }

    await controller.getAssessment(user, "assessment-1");
    await controller.startAttempt(user, "assessment-1");
    await controller.getAttempt(user, "attempt-1");
    await controller.submitAttempt(user, "attempt-1");

    expect(assessments.getAssessment).toHaveBeenCalledWith(user, "assessment-1");
    expect(assessments.startAttempt).toHaveBeenCalledWith(user, "assessment-1");
    expect(assessments.getAttempt).toHaveBeenCalledWith(user, "attempt-1");
    expect(assessments.submitAttempt).toHaveBeenCalledWith(user, "attempt-1");
  });

  it("unwraps the answers array from the body", async () => {
    assessments.saveAnswers.mockResolvedValue({});

    await controller.saveAnswers(user, "attempt-1", {
      answers: [{ questionId: "q-1", selectedOptionIds: ["o-1"] }],
    });

    expect(assessments.saveAnswers).toHaveBeenCalledWith(user, "attempt-1", [
      { questionId: "q-1", selectedOptionIds: ["o-1"] },
    ]);
  });
});
