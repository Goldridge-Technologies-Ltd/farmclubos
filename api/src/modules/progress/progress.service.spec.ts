import { jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { ProgressService } from "./progress.service.js";

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

describe("ProgressService", () => {
  let service: ProgressService;
  let tx: {
    lessonProgress: { upsert: AsyncMock; count: AsyncMock };
    moduleProgress: { upsert: AsyncMock };
    lesson: { count: AsyncMock };
    enrolment: { update: AsyncMock; updateMany: AsyncMock };
  };
  let prisma: {
    lesson: { findFirst: AsyncMock };
    enrolment: { findFirst: AsyncMock; findMany: AsyncMock };
    lessonProgress: { findMany: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    tx = {
      lessonProgress: { upsert: fn(), count: fn() },
      moduleProgress: { upsert: fn() },
      lesson: { count: fn() },
      enrolment: { update: fn(), updateMany: fn() },
    };

    prisma = {
      lesson: { findFirst: fn() },
      enrolment: { findFirst: fn(), findMany: fn() },
      lessonProgress: { findMany: fn() },
      $transaction: jest.fn(async (work: unknown) =>
        (work as (client: typeof tx) => Promise<unknown>)(tx),
      ),
    };

    prisma.lesson.findFirst.mockResolvedValue({
      id: "lesson-1",
      moduleId: "module-1",
      module: { pathwayId: "pathway-1" },
    });
    prisma.enrolment.findFirst.mockResolvedValue({ id: "enrolment-1" });

    const moduleRef = await Test.createTestingModule({
      providers: [ProgressService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ProgressService);
  });

  /** Completed / published, as whole percent. */
  const counts = (moduleTotal: number, moduleDone: number, pathTotal: number, pathDone: number) => {
    tx.lesson.count
      .mockResolvedValueOnce(moduleTotal)
      .mockResolvedValueOnce(pathTotal);
    tx.lessonProgress.count
      .mockResolvedValueOnce(moduleDone)
      .mockResolvedValueOnce(pathDone);
  };

  describe("completeLesson", () => {
    it("records the completion against the enrolment, not the user", async () => {
      counts(1, 1, 7, 1);

      await service.completeLesson(learner, "lesson-1");

      const [args] = tx.lessonProgress.upsert.mock.calls[0] as [
        { where: { enrolmentId_lessonId: { enrolmentId: string } } },
      ];
      // The same person could take the same pathway with two institutions;
      // those are two records, and a user id could not tell them apart.
      expect(args.where.enrolmentId_lessonId.enrolmentId).toBe("enrolment-1");
    });

    it("computes the percentage from rows rather than incrementing", async () => {
      counts(7, 3, 21, 7);

      const result = await service.completeLesson(learner, "lesson-1");

      // 7 of 21 published lessons.
      expect(result.progressPercent).toBe(33);
    });

    it("completes the module only when every lesson in it is done", async () => {
      counts(3, 2, 21, 2);

      await expect(service.completeLesson(learner, "lesson-1")).resolves.toMatchObject({
        moduleStatus: "IN_PROGRESS",
      });

      counts(3, 3, 21, 3);

      await expect(service.completeLesson(learner, "lesson-1")).resolves.toMatchObject({
        moduleStatus: "COMPLETED",
      });
    });

    it("finishes the enrolment when the whole pathway is done", async () => {
      counts(1, 1, 21, 21);

      const result = await service.completeLesson(learner, "lesson-1");

      expect(result.progressPercent).toBe(100);
      const [args] = tx.enrolment.update.mock.calls[0] as [{ data: { status?: string } }];
      expect(args.data.status).toBe("COMPLETED");
    });

    it("is 0% for a pathway with nothing published, not 100%", async () => {
      counts(0, 0, 0, 0);

      // Dividing by zero would claim the learner had finished.
      await expect(service.completeLesson(learner, "lesson-1")).resolves.toMatchObject({
        progressPercent: 0,
      });
    });

    it("stamps the start once, leaving an earlier one alone", async () => {
      counts(1, 1, 7, 1);

      await service.completeLesson(learner, "lesson-1");

      const [args] = tx.enrolment.updateMany.mock.calls[0] as [
        { where: { startedAt: null } },
      ];
      expect(args.where.startedAt).toBeNull();
    });

    it("is a 404 for a lesson that is not published", async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.completeLesson(learner, "lesson-9")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("is a 404, not a 403, for someone not enrolled on the pathway", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      // Not being enrolled is not an authorisation failure, and a 403 would
      // confirm the lesson exists.
      await expect(service.completeLesson(learner, "lesson-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("refuses to write when the caller has no active institution", async () => {
      await expect(
        service.completeLesson({ ...learner, institutionId: null }, "lesson-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.enrolment.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("myJourney", () => {
    const enrolmentRow = {
      id: "enrolment-1",
      status: "ACTIVE",
      progressPercent: 14,
      cohort: {
        id: "cohort-1",
        name: "September intake",
        pathway: {
          id: "pathway-1",
          slug: "foundation",
          title: "Foundation",
          modules: [
            {
              id: "module-1",
              slug: "fundamentals",
              title: "Fundamentals",
              sequence: 1,
              lessons: [
                { id: "lesson-1", slug: "one", title: "One" },
                { id: "lesson-2", slug: "two", title: "Two" },
              ],
            },
          ],
        },
      },
    };

    it("reports what is recorded, and NOT_STARTED for what is not", async () => {
      prisma.enrolment.findMany.mockResolvedValue([enrolmentRow]);
      prisma.lessonProgress.findMany.mockResolvedValue([
        {
          enrolmentId: "enrolment-1",
          lessonId: "lesson-1",
          status: "COMPLETED",
          completedAt: new Date("2026-09-20T10:00:00Z"),
        },
      ]);

      const [journey] = await service.myJourney(learner);

      expect(journey.modules[0].lessonsCompleted).toBe(1);
      expect(journey.modules[0].lessonCount).toBe(2);
      expect(journey.modules[0].status).toBe("IN_PROGRESS");
      // A lesson with no row is not started — never guessed at.
      expect(journey.modules[0].lessons[1]).toMatchObject({
        status: "NOT_STARTED",
        completedAt: null,
      });
    });

    it("never mixes one enrolment's progress into another's", async () => {
      prisma.enrolment.findMany.mockResolvedValue([enrolmentRow]);
      prisma.lessonProgress.findMany.mockResolvedValue([
        { enrolmentId: "enrolment-2", lessonId: "lesson-1", status: "COMPLETED", completedAt: new Date() },
      ]);

      const [journey] = await service.myJourney(learner);

      expect(journey.modules[0].lessonsCompleted).toBe(0);
    });

    it("returns nothing for someone with no active institution", async () => {
      await expect(
        service.myJourney({ ...learner, institutionId: null }),
      ).resolves.toEqual([]);
      expect(prisma.enrolment.findMany).not.toHaveBeenCalled();
    });

    it("does not ask for progress when there are no enrolments", async () => {
      prisma.enrolment.findMany.mockResolvedValue([]);

      await expect(service.myJourney(learner)).resolves.toEqual([]);
      expect(prisma.lessonProgress.findMany).not.toHaveBeenCalled();
    });
  });
});
