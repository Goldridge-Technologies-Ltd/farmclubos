import { jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { AssessmentsService } from "./assessments.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const learner: AuthenticatedUser = {
  userId: "user-1",
  sessionId: "session-1",
  email: "ada@example.com",
  platformRole: "NONE",
  institutionId: "institution-1",
  institutionRole: "LEARNER",
};

/*
  The four question types the starter quiz uses, with their answer keys. Only
  the service ever sees `isCorrect`.
*/
const questions = [
  {
    id: "q-single",
    prompt: "Single",
    helpText: null,
    type: "SINGLE_CHOICE",
    points: 1,
    sequence: 1,
    options: [
      { id: "o-1a", label: "Right", isCorrect: true, sequence: 1 },
      { id: "o-1b", label: "Wrong", isCorrect: false, sequence: 2 },
    ],
  },
  {
    id: "q-multi",
    prompt: "Multiple",
    helpText: null,
    type: "MULTIPLE_CHOICE",
    points: 2,
    sequence: 2,
    options: [
      { id: "o-2a", label: "Right", isCorrect: true, sequence: 1 },
      { id: "o-2b", label: "Also right", isCorrect: true, sequence: 2 },
      { id: "o-2c", label: "Wrong", isCorrect: false, sequence: 3 },
    ],
  },
  {
    id: "q-truefalse",
    prompt: "True or false",
    helpText: null,
    type: "TRUE_FALSE",
    points: 1,
    sequence: 3,
    options: [
      { id: "o-3a", label: "True", isCorrect: true, sequence: 1 },
      { id: "o-3b", label: "False", isCorrect: false, sequence: 2 },
    ],
  },
  {
    id: "q-written",
    prompt: "In your own words",
    helpText: null,
    type: "SHORT_ANSWER",
    points: 4,
    sequence: 4,
    options: [],
  },
];

const assessmentRow = (overrides: Record<string, unknown> = {}) => ({
  id: "assessment-1",
  slug: "module-check",
  title: "Module check",
  instructions: null,
  kind: "QUIZ",
  authoringStatus: "PLACEHOLDER",
  passMarkPercent: 70,
  maxAttempts: null,
  timeLimitMinutes: null,
  module: {
    slug: "fundamentals",
    title: "Fundamentals",
    pathwayId: "pathway-1",
    pathway: { slug: "foundation", title: "Foundation" },
  },
  questions,
  ...overrides,
});

const attemptRow = (overrides: Record<string, unknown> = {}) => ({
  id: "attempt-1",
  enrolmentId: "enrolment-1",
  assessmentId: "assessment-1",
  attemptNumber: 1,
  status: "IN_PROGRESS",
  startedAt: new Date("2026-09-22T10:00:00Z"),
  submittedAt: null,
  scorePercent: null,
  passed: null,
  assessment: assessmentRow(),
  responses: [],
  ...overrides,
});

describe("AssessmentsService", () => {
  let service: AssessmentsService;
  let tx: {
    assessmentResponse: {
      deleteMany: AsyncMock;
      create: AsyncMock;
      findMany: AsyncMock;
      updateMany: AsyncMock;
    };
    assessmentAttempt: { update: AsyncMock };
  };
  let prisma: {
    assessment: { findFirst: AsyncMock };
    enrolment: { findFirst: AsyncMock };
    assessmentAttempt: { findFirst: AsyncMock; count: AsyncMock; create: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    tx = {
      assessmentResponse: { deleteMany: fn(), create: fn(), findMany: fn(), updateMany: fn() },
      assessmentAttempt: { update: fn() },
    };

    prisma = {
      assessment: { findFirst: fn() },
      enrolment: { findFirst: fn() },
      assessmentAttempt: { findFirst: fn(), count: fn(), create: fn() },
      $transaction: jest.fn(async (work: unknown) =>
        (work as (client: typeof tx) => Promise<unknown>)(tx),
      ),
    };

    prisma.assessment.findFirst.mockResolvedValue(assessmentRow());
    prisma.enrolment.findFirst.mockResolvedValue({ id: "enrolment-1" });
    prisma.assessmentAttempt.count.mockResolvedValue(0);

    const moduleRef = await Test.createTestingModule({
      providers: [AssessmentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AssessmentsService);
  });

  describe("getAssessment", () => {
    it("never tells a learner which option is correct", async () => {
      const view = await service.getAssessment(learner, "assessment-1");

      // The single rule this whole module exists to keep.
      expect(JSON.stringify(view)).not.toContain("isCorrect");
      expect(view.questions[0].options[0]).toEqual({
        id: "o-1a",
        label: "Right",
        sequence: 1,
      });
    });

    it("reports how many attempts the caller has already used", async () => {
      prisma.assessmentAttempt.count.mockResolvedValue(2);

      await expect(service.getAssessment(learner, "assessment-1")).resolves.toMatchObject({
        attemptsUsed: 2,
        canAttempt: true,
      });
    });

    it("says no more attempts once the limit is reached", async () => {
      prisma.assessment.findFirst.mockResolvedValue(assessmentRow({ maxAttempts: 2 }));
      prisma.assessmentAttempt.count.mockResolvedValue(2);

      await expect(service.getAssessment(learner, "assessment-1")).resolves.toMatchObject({
        canAttempt: false,
      });
    });

    it("is a 404 for someone not enrolled on the pathway", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      await expect(service.getAssessment(learner, "assessment-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("startAttempt", () => {
    it("resumes the attempt already in progress rather than starting a second", async () => {
      prisma.assessmentAttempt.findFirst.mockResolvedValue(attemptRow());

      const view = await service.startAttempt(learner, "assessment-1");

      expect(view.id).toBe("attempt-1");
      // A reload must not burn an attempt, nor lose the answers already saved.
      expect(prisma.assessmentAttempt.create).not.toHaveBeenCalled();
    });

    it("numbers a new attempt after the ones already taken", async () => {
      prisma.assessmentAttempt.findFirst.mockResolvedValue(null);
      prisma.assessmentAttempt.count.mockResolvedValue(2);
      prisma.assessmentAttempt.create.mockResolvedValue(attemptRow({ attemptNumber: 3 }));

      await service.startAttempt(learner, "assessment-1");

      const [args] = prisma.assessmentAttempt.create.mock.calls[0] as [
        { data: { attemptNumber: number; enrolmentId: string } },
      ];
      expect(args.data.attemptNumber).toBe(3);
      expect(args.data.enrolmentId).toBe("enrolment-1");
    });

    it("refuses once the attempt limit is used up", async () => {
      prisma.assessment.findFirst.mockResolvedValue(assessmentRow({ maxAttempts: 1 }));
      prisma.assessmentAttempt.findFirst.mockResolvedValue(null);
      prisma.assessmentAttempt.count.mockResolvedValue(1);

      await expect(service.startAttempt(learner, "assessment-1")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("saveAnswers", () => {
    beforeEach(() => {
      prisma.assessmentAttempt.findFirst.mockResolvedValue(attemptRow());
      tx.assessmentResponse.findMany.mockResolvedValue([]);
      tx.assessmentAttempt.update.mockResolvedValue(attemptRow());
    });

    it("replaces the answer to a question rather than adding another", async () => {
      await service.saveAnswers(learner, "attempt-1", [
        { questionId: "q-single", selectedOptionIds: ["o-1b"] },
      ]);

      // Without the delete, two answers to one question would both count.
      expect(tx.assessmentResponse.deleteMany).toHaveBeenCalledWith({
        where: { attemptId: "attempt-1", questionId: { in: ["q-single"] } },
      });
    });

    it("ignores an option that belongs to a different question", async () => {
      await service.saveAnswers(learner, "attempt-1", [
        { questionId: "q-single", selectedOptionIds: ["o-1a", "o-2a"] },
      ]);

      const [args] = tx.assessmentResponse.create.mock.calls[0] as [
        { data: { selectedOptions: { create: { optionId: string }[] } } },
      ];
      // o-2a is another question's option; accepting it would corrupt grading.
      expect(args.data.selectedOptions.create).toEqual([{ optionId: "o-1a" }]);
    });

    it("keeps only one choice for a single-answer question", async () => {
      await service.saveAnswers(learner, "attempt-1", [
        { questionId: "q-single", selectedOptionIds: ["o-1a", "o-1b"] },
      ]);

      const [args] = tx.assessmentResponse.create.mock.calls[0] as [
        { data: { selectedOptions: { create: { optionId: string }[] } } },
      ];
      expect(args.data.selectedOptions.create).toHaveLength(1);
    });

    it("refuses to change an attempt that has been submitted", async () => {
      prisma.assessmentAttempt.findFirst.mockResolvedValue(
        attemptRow({ status: "GRADED", submittedAt: new Date() }),
      );

      await expect(
        service.saveAnswers(learner, "attempt-1", [{ questionId: "q-single" }]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("is a 404 for an attempt belonging to someone else", async () => {
      prisma.assessmentAttempt.findFirst.mockResolvedValue(null);

      await expect(
        service.saveAnswers(learner, "attempt-9", [{ questionId: "q-single" }]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("submitAttempt", () => {
    const submitWith = (
      responses: Array<{ questionId: string; optionIds?: string[]; textAnswer?: string }>,
    ) => {
      prisma.assessmentAttempt.findFirst.mockResolvedValue(attemptRow());
      tx.assessmentResponse.findMany.mockResolvedValue(
        responses.map((response) => ({
          id: `r-${response.questionId}`,
          questionId: response.questionId,
          textAnswer: response.textAnswer ?? null,
          selectedOptions: (response.optionIds ?? []).map((optionId) => ({ optionId })),
        })),
      );
      tx.assessmentAttempt.update.mockImplementation((args: unknown) =>
        Promise.resolve({
          ...attemptRow({ status: "GRADED" }),
          ...(args as { data: object }).data,
        }),
      );
    };

    const gradedWith = () =>
      (tx.assessmentAttempt.update.mock.calls[0] as [
        { data: { scorePercent: number; passed: boolean } },
      ])[0].data;

    it("marks a single choice right only for the correct option", async () => {
      submitWith([{ questionId: "q-single", optionIds: ["o-1a"] }]);

      await service.submitAttempt(learner, "attempt-1");

      // 1 of 4 auto-gradable points: the written question is not counted.
      expect(gradedWith().scorePercent).toBe(25);
    });

    it("needs every correct option, and no wrong one, for a multiple choice", async () => {
      submitWith([{ questionId: "q-multi", optionIds: ["o-2a"] }]);
      await service.submitAttempt(learner, "attempt-1");
      expect(gradedWith().scorePercent).toBe(0);

      jest.clearAllMocks();
      submitWith([{ questionId: "q-multi", optionIds: ["o-2a", "o-2b", "o-2c"] }]);
      await service.submitAttempt(learner, "attempt-1");
      expect(gradedWith().scorePercent).toBe(0);

      jest.clearAllMocks();
      submitWith([{ questionId: "q-multi", optionIds: ["o-2b", "o-2a"] }]);
      await service.submitAttempt(learner, "attempt-1");
      // Order must not matter; 2 of 4 points.
      expect(gradedWith().scorePercent).toBe(50);
    });

    /*
      A written answer cannot be machine-marked. Counting it as wrong would
      cap an otherwise perfect attempt at 50% and fail the learner for a
      question no machine could ever mark. It is left out of the score and
      flagged for a person instead.
    */
    it("leaves a written answer out of the score rather than marking it wrong", async () => {
      submitWith([
        { questionId: "q-single", optionIds: ["o-1a"] },
        { questionId: "q-multi", optionIds: ["o-2a", "o-2b"] },
        { questionId: "q-truefalse", optionIds: ["o-3a"] },
        { questionId: "q-written", textAnswer: "Tomatoes, sold to the market nearby." },
      ]);

      const view = await service.submitAttempt(learner, "attempt-1");

      expect(gradedWith().scorePercent).toBe(100);
      expect(gradedWith().passed).toBe(true);
      expect(view.questionsAwaitingReview).toBe(1);
    });

    it("passes only at or above the pass mark", async () => {
      submitWith([
        { questionId: "q-single", optionIds: ["o-1a"] },
        { questionId: "q-truefalse", optionIds: ["o-3a"] },
      ]);

      await service.submitAttempt(learner, "attempt-1");

      // 2 of 4 points is 50%, under the 70% mark.
      expect(gradedWith().scorePercent).toBe(50);
      expect(gradedWith().passed).toBe(false);
    });

    it("scores an unanswered attempt zero without failing", async () => {
      submitWith([]);

      await service.submitAttempt(learner, "attempt-1");

      expect(gradedWith().scorePercent).toBe(0);
      expect(gradedWith().passed).toBe(false);
    });

    it("refuses to submit the same attempt twice", async () => {
      prisma.assessmentAttempt.findFirst.mockResolvedValue(
        attemptRow({ status: "GRADED", submittedAt: new Date() }),
      );

      await expect(service.submitAttempt(learner, "attempt-1")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("a member who has been removed", () => {
    it("cannot start or read an assessment", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      await service.getAssessment(learner, "assessment-1").catch(() => undefined);

      const [args] = prisma.enrolment.findFirst.mock.calls[0] as [{ where: { user: unknown } }];
      expect(args.where.user).toEqual({ memberships: { some: { institutionId: "institution-1", status: "ACTIVE" } } });
    });

    it("cannot reach an attempt they already started", async () => {
      prisma.assessmentAttempt.findFirst.mockResolvedValue(null);

      await service.getAttempt(learner, "attempt-1").catch(() => undefined);

      const [args] = prisma.assessmentAttempt.findFirst.mock.calls[0] as [
        { where: { enrolment: { user: unknown } } },
      ];
      expect(args.where.enrolment.user).toEqual({ memberships: { some: { institutionId: "institution-1", status: "ACTIVE" } } });
    });
  });
});
