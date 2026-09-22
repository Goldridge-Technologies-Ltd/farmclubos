import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { QuestionType } from "../../generated/prisma/enums.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import type {
  AnswerInput,
  AssessmentView,
  AttemptResponseView,
  AttemptView,
} from "./assessments.types.js";

/*
  Taking and grading an assessment.

  `AssessmentOption.isCorrect` is loaded here and leaves in no response. The
  learner is told whether *their* answer was right, which is the point of
  feedback; which option was right stays in the service (api/AGENTS.md).

  Written answers cannot be machine-marked. They are left out of the score
  rather than counted wrong — marking them wrong would cap an otherwise
  perfect attempt and fail someone for a question no machine could grade — and
  the attempt says how many are waiting for a person.
*/

const published = { status: "PUBLISHED", archivedAt: null } as const;

/** One answer only, whatever the client sent. */
const SINGLE_ANSWER_TYPES: QuestionType[] = ["SINGLE_CHOICE", "TRUE_FALSE"];

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssessment(user: AuthenticatedUser, assessmentId: string): Promise<AssessmentView> {
    const assessment = await this.loadAssessment(assessmentId);
    const enrolment = await this.enrolmentFor(user, assessment.module.pathwayId);
    const attemptsUsed = await this.prisma.assessmentAttempt.count({
      where: { enrolmentId: enrolment.id, assessmentId },
    });

    return {
      id: assessment.id,
      slug: assessment.slug,
      title: assessment.title,
      instructions: assessment.instructions,
      kind: assessment.kind,
      authoringStatus: assessment.authoringStatus,
      passMarkPercent: assessment.passMarkPercent,
      maxAttempts: assessment.maxAttempts,
      timeLimitMinutes: assessment.timeLimitMinutes,
      pathway: assessment.module.pathway,
      module: { slug: assessment.module.slug, title: assessment.module.title },
      questions: assessment.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        helpText: question.helpText,
        type: question.type,
        points: question.points,
        sequence: question.sequence,
        // isCorrect is dropped here, deliberately and in one place.
        options: question.options.map(({ id, label, sequence }) => ({ id, label, sequence })),
      })),
      attemptsUsed,
      canAttempt: withinLimit(attemptsUsed, assessment.maxAttempts),
    };
  }

  /**
   * The attempt in progress, or a new one.
   *
   * Resuming matters: a reload must not burn an attempt or lose the answers
   * already saved.
   */
  async startAttempt(user: AuthenticatedUser, assessmentId: string): Promise<AttemptView> {
    const assessment = await this.loadAssessment(assessmentId);
    const enrolment = await this.enrolmentFor(user, assessment.module.pathwayId);

    const existing = await this.prisma.assessmentAttempt.findFirst({
      where: { enrolmentId: enrolment.id, assessmentId, status: "IN_PROGRESS" },
      orderBy: { attemptNumber: "desc" },
      select: attemptSelect,
    });

    if (existing) {
      return toAttemptView(existing);
    }

    const attemptsUsed = await this.prisma.assessmentAttempt.count({
      where: { enrolmentId: enrolment.id, assessmentId },
    });

    if (!withinLimit(attemptsUsed, assessment.maxAttempts)) {
      throw new BadRequestException({
        code: "NO_ATTEMPTS_LEFT",
        message: "You have used every attempt at this assessment.",
      });
    }

    const created = await this.prisma.assessmentAttempt.create({
      data: {
        enrolmentId: enrolment.id,
        assessmentId,
        attemptNumber: attemptsUsed + 1,
        status: "IN_PROGRESS",
      },
      select: attemptSelect,
    });

    return toAttemptView(created);
  }

  /** Saves answers as they are given, so nothing is lost before submitting. */
  async saveAnswers(
    user: AuthenticatedUser,
    attemptId: string,
    answers: AnswerInput[],
  ): Promise<AttemptView> {
    const attempt = await this.loadOwnAttempt(user, attemptId);

    if (attempt.status !== "IN_PROGRESS") {
      throw alreadySubmitted();
    }

    const questions = new Map(
      attempt.assessment.questions.map((question) => [question.id, question]),
    );
    const answered = answers.filter((answer) => questions.has(answer.questionId));

    if (answered.length === 0) {
      return toAttemptView(attempt);
    }

    return this.prisma.$transaction(async (tx) => {
      // Replace rather than add: two answers to one question would both count.
      await tx.assessmentResponse.deleteMany({
        where: {
          attemptId,
          questionId: { in: answered.map((answer) => answer.questionId) },
        },
      });

      for (const answer of answered) {
        const question = questions.get(answer.questionId);

        if (!question) {
          continue;
        }

        // Only options that belong to this question, and only one where one
        // is all that makes sense. Anything else corrupts grading.
        const ownOptionIds = new Set(question.options.map((option) => option.id));
        let selected = (answer.selectedOptionIds ?? []).filter((id) => ownOptionIds.has(id));

        if (SINGLE_ANSWER_TYPES.includes(question.type)) {
          selected = selected.slice(0, 1);
        }

        await tx.assessmentResponse.create({
          data: {
            attemptId,
            questionId: question.id,
            textAnswer: answer.textAnswer?.trim() || null,
            selectedOptions: { create: selected.map((optionId) => ({ optionId })) },
          },
        });
      }

      const responses = await tx.assessmentResponse.findMany({
        where: { attemptId },
        select: responseSelect,
      });

      return toAttemptView({ ...attempt, responses });
    });
  }

  async submitAttempt(user: AuthenticatedUser, attemptId: string): Promise<AttemptView> {
    const attempt = await this.loadOwnAttempt(user, attemptId);

    if (attempt.status !== "IN_PROGRESS") {
      throw alreadySubmitted();
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const responses = await tx.assessmentResponse.findMany({
        where: { attemptId },
        select: responseSelect,
      });

      const answered = new Map(responses.map((response) => [response.questionId, response]));
      let gradablePoints = 0;
      let awarded = 0;
      let awaitingReview = 0;
      const graded: AttemptResponseView[] = [];

      for (const question of attempt.assessment.questions) {
        const response = answered.get(question.id);
        const selected = new Set(
          (response?.selectedOptions ?? []).map((option) => option.optionId),
        );

        if (question.options.length === 0) {
          // A written answer. Only one that was actually given waits for a
          // person; an empty one is simply unanswered.
          if (response?.textAnswer) {
            awaitingReview += 1;
          }

          graded.push({
            questionId: question.id,
            selectedOptionIds: [],
            textAnswer: response?.textAnswer ?? null,
            isCorrect: null,
            pointsAwarded: null,
          });

          continue;
        }

        gradablePoints += question.points;

        const correct = new Set(
          question.options.filter((option) => option.isCorrect).map((option) => option.id),
        );
        // Every correct option and no wrong one. Set equality, so the order
        // the learner picked them in cannot matter.
        const isCorrect =
          selected.size === correct.size && [...correct].every((id) => selected.has(id));
        const points = isCorrect ? question.points : 0;

        awarded += points;

        graded.push({
          questionId: question.id,
          selectedOptionIds: [...selected],
          textAnswer: null,
          isCorrect,
          pointsAwarded: points,
        });

        await tx.assessmentResponse.updateMany({
          where: { attemptId, questionId: question.id },
          data: { isCorrect, pointsAwarded: points },
        });
      }

      const scorePercent =
        gradablePoints === 0 ? 0 : Math.round((awarded / gradablePoints) * 100);
      const passed = gradablePoints > 0 && scorePercent >= attempt.assessment.passMarkPercent;

      const updated = await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          status: "GRADED",
          submittedAt: now,
          gradedAt: now,
          scorePercent,
          passed,
        },
        select: attemptSelect,
      });

      return {
        ...toAttemptView({ ...attempt, ...updated }),
        questionsAwaitingReview: awaitingReview,
        responses: graded,
      };
    });
  }

  async getAttempt(user: AuthenticatedUser, attemptId: string): Promise<AttemptView> {
    return toAttemptView(await this.loadOwnAttempt(user, attemptId));
  }

  /** Published assessments only, reached through a published module and pathway. */
  private async loadAssessment(assessmentId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        ...published,
        module: { ...published, pathway: published },
      },
      select: assessmentSelect,
    });

    if (!assessment) {
      throw notFound("assessment");
    }

    return assessment;
  }

  /**
   * An attempt of the caller's own. Found through their enrolment, their user
   * id and their active institution — never by id alone.
   */
  private async loadOwnAttempt(user: AuthenticatedUser, attemptId: string) {
    if (!user.institutionId) {
      throw notFound("attempt");
    }

    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        id: attemptId,
        enrolment: {
          userId: user.userId,
          institutionId: user.institutionId,
        },
      },
      select: attemptSelect,
    });

    if (!attempt) {
      throw notFound("attempt");
    }

    return attempt;
  }

  private async enrolmentFor(
    user: AuthenticatedUser,
    pathwayId: string,
  ): Promise<{ id: string }> {
    if (!user.institutionId) {
      throw notFound("enrolment");
    }

    const enrolment = await this.prisma.enrolment.findFirst({
      where: {
        userId: user.userId,
        institutionId: user.institutionId,
        status: { in: ["INVITED", "ACTIVE"] },
        cohort: { pathwayId, archivedAt: null },
      },
      orderBy: { enrolledAt: "desc" },
      select: { id: true },
    });

    if (!enrolment) {
      throw notFound("enrolment");
    }

    return enrolment;
  }
}

const questionSelect = {
  id: true,
  prompt: true,
  helpText: true,
  type: true,
  points: true,
  sequence: true,
  options: {
    orderBy: { sequence: "asc" },
    // isCorrect is loaded because grading needs it, and is dropped before
    // anything leaves this service.
    select: { id: true, label: true, isCorrect: true, sequence: true },
  },
} as const;

const assessmentSelect = {
  id: true,
  slug: true,
  title: true,
  instructions: true,
  kind: true,
  authoringStatus: true,
  passMarkPercent: true,
  maxAttempts: true,
  timeLimitMinutes: true,
  module: {
    select: {
      slug: true,
      title: true,
      pathwayId: true,
      pathway: { select: { slug: true, title: true } },
    },
  },
  questions: { orderBy: { sequence: "asc" }, select: questionSelect },
} as const;

const responseSelect = {
  questionId: true,
  textAnswer: true,
  isCorrect: true,
  pointsAwarded: true,
  selectedOptions: { select: { optionId: true } },
} as const;

const attemptSelect = {
  id: true,
  enrolmentId: true,
  assessmentId: true,
  attemptNumber: true,
  status: true,
  startedAt: true,
  submittedAt: true,
  scorePercent: true,
  passed: true,
  assessment: { select: assessmentSelect },
  responses: { select: responseSelect },
} as const;

type AttemptRow = {
  id: string;
  assessmentId: string;
  attemptNumber: number;
  status: AttemptView["status"];
  startedAt: Date;
  submittedAt: Date | null;
  scorePercent: number | null;
  passed: boolean | null;
  assessment: { questions: { id: string; options: { id: string }[] }[] };
  responses: {
    questionId: string;
    textAnswer: string | null;
    isCorrect: boolean | null;
    pointsAwarded: number | null;
    selectedOptions: { optionId: string }[];
  }[];
};

function toAttemptView(attempt: AttemptRow): AttemptView {
  const responses = attempt.responses.map((response) => ({
    questionId: response.questionId,
    selectedOptionIds: response.selectedOptions.map((option) => option.optionId),
    textAnswer: response.textAnswer,
    isCorrect: response.isCorrect,
    pointsAwarded: response.pointsAwarded,
  }));

  const written = new Set(
    attempt.assessment.questions
      .filter((question) => question.options.length === 0)
      .map((question) => question.id),
  );

  return {
    id: attempt.id,
    assessmentId: attempt.assessmentId,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    scorePercent: attempt.scorePercent,
    passed: attempt.passed,
    questionsAwaitingReview: responses.filter(
      (response) => written.has(response.questionId) && response.textAnswer,
    ).length,
    responses,
  };
}

/** Null means no limit at all. */
function withinLimit(used: number, maxAttempts: number | null): boolean {
  return maxAttempts === null || used < maxAttempts;
}

function alreadySubmitted() {
  return new BadRequestException({
    code: "ATTEMPT_ALREADY_SUBMITTED",
    message: "This attempt has been submitted and cannot be changed.",
  });
}

function notFound(what: string) {
  return new NotFoundException({
    code: "NOT_FOUND",
    message:
      what === "enrolment"
        ? "You are not enrolled on this pathway."
        : `That ${what} does not exist, or has not been published.`,
  });
}
