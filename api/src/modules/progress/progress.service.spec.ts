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
    lessonProgress: {
      upsert: AsyncMock;
      count: AsyncMock;
      findUnique: AsyncMock;
      create: AsyncMock;
      update: AsyncMock;
    };
    sceneProgress: { upsert: AsyncMock; count: AsyncMock };
    lessonScene: { count: AsyncMock };
    moduleProgress: { upsert: AsyncMock };
    lesson: { count: AsyncMock };
    enrolment: { update: AsyncMock; updateMany: AsyncMock };
  };
  let prisma: {
    lesson: { findFirst: AsyncMock; count: AsyncMock };
    lessonScene: { findFirst: AsyncMock };
    sceneProgress: { findMany: AsyncMock };
    enrolment: { findFirst: AsyncMock; findMany: AsyncMock; update: AsyncMock };
    lessonProgress: { findMany: AsyncMock; count: AsyncMock; findUnique: AsyncMock };
    moduleProgress: { updateMany: AsyncMock };
    $transaction: jest.Mock<(work: unknown) => Promise<unknown>>;
  };

  beforeEach(async () => {
    tx = {
      lessonProgress: { upsert: fn(), count: fn(), findUnique: fn(), create: fn(), update: fn() },
      sceneProgress: { upsert: fn(), count: fn() },
      lessonScene: { count: fn() },
      moduleProgress: { upsert: fn() },
      lesson: { count: fn() },
      enrolment: { update: fn(), updateMany: fn() },
    };

    prisma = {
      lesson: { findFirst: fn(), count: fn() },
      lessonScene: { findFirst: fn() },
      sceneProgress: { findMany: fn() },
      enrolment: { findFirst: fn(), findMany: fn(), update: fn() },
      lessonProgress: { findMany: fn(), count: fn(), findUnique: fn() },
      moduleProgress: { updateMany: fn() },
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

      const [args] = tx.lessonProgress.create.mock.calls[0] as [
        { data: { enrolmentId: string; status: string } },
      ];
      // The same person could take the same pathway with two institutions;
      // those are two records, and a user id could not tell them apart.
      expect(args.data).toMatchObject({ enrolmentId: "enrolment-1", status: "COMPLETED" });
    });

    it("keeps the date it was first completed when completed again", async () => {
      tx.lessonProgress.findUnique.mockResolvedValue({ status: "COMPLETED" });
      counts(1, 1, 7, 1);

      await service.completeLesson(learner, "lesson-1");

      expect(tx.lessonProgress.create).not.toHaveBeenCalled();
      expect(tx.lessonProgress.update).not.toHaveBeenCalled();
    });

    it("completes a lesson that was under way", async () => {
      tx.lessonProgress.findUnique.mockResolvedValue({ status: "IN_PROGRESS" });
      counts(1, 1, 7, 1);

      await service.completeLesson(learner, "lesson-1");

      const [args] = tx.lessonProgress.update.mock.calls[0] as [{ data: object }];
      expect(args.data).toEqual({ status: "COMPLETED", completedAt: expect.any(Date) });
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
        status: "OPEN",
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

    it("says when the intake has closed, which does not stop the learner", async () => {
      prisma.enrolment.findMany.mockResolvedValue([
        { ...enrolmentRow, cohort: { ...enrolmentRow.cohort, status: "COMPLETED" } },
      ]);
      prisma.lessonProgress.findMany.mockResolvedValue([]);

      const [journey] = await service.myJourney(learner);

      expect(journey.cohort).toEqual({
        id: "cohort-1",
        name: "September intake",
        status: "COMPLETED",
      });
      expect(journey.status).toBe("ACTIVE");
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

  describe("a member who has been removed", () => {
    it("cannot record progress, even with a token that still names the institution", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      await service.completeLesson(learner, "lesson-1").catch(() => undefined);

      const [args] = prisma.enrolment.findFirst.mock.calls[0] as [{ where: { user: unknown } }];
      expect(args.where.user).toEqual({ memberships: { some: { institutionId: "institution-1", status: "ACTIVE" } } });
    });

    it("is not shown their journey", async () => {
      prisma.enrolment.findMany.mockResolvedValue([]);

      await service.myJourney(learner);

      const [args] = prisma.enrolment.findMany.mock.calls[0] as [{ where: { user: unknown } }];
      expect(args.where.user).toEqual({ memberships: { some: { institutionId: "institution-1", status: "ACTIVE" } } });
    });
  });

  /*
    Publishing, unpublishing or archiving a lesson changes how many there are,
    so every enrolment's percentage has to follow — or a learner at "2 of 7"
    keeps a percentage from when there were seven after an eighth arrives.
  */
  describe("recomputePathway", () => {
    beforeEach(() => {
      prisma.enrolment.findMany.mockResolvedValue([{ id: "enrolment-1" }, { id: "enrolment-2" }]);
    });

    it("recalculates each enrolment's percentage from what is published now", async () => {
      prisma.lesson.count.mockResolvedValue(8);
      prisma.lessonProgress.count.mockResolvedValueOnce(2).mockResolvedValueOnce(4);

      await service.recomputePathway("pathway-1");

      expect(prisma.enrolment.update).toHaveBeenCalledWith({
        where: { id: "enrolment-1" },
        data: { progressPercent: 25 },
      });
      expect(prisma.enrolment.update).toHaveBeenCalledWith({
        where: { id: "enrolment-2" },
        data: { progressPercent: 50 },
      });
    });

    it("covers every enrolment on the pathway's cohorts, withdrawn ones included", async () => {
      prisma.lesson.count.mockResolvedValue(8);
      prisma.lessonProgress.count.mockResolvedValue(0);

      await service.recomputePathway("pathway-1");

      const [args] = prisma.enrolment.findMany.mock.calls[0] as [{ where: unknown }];
      expect(args.where).toEqual({ cohort: { pathwayId: "pathway-1" } });
    });

    it("changes only the percentage — never whether someone started or finished", async () => {
      prisma.lesson.count.mockResolvedValue(4);
      prisma.lessonProgress.count.mockResolvedValue(4);

      await service.recomputePathway("pathway-1");

      const [first] = prisma.enrolment.update.mock.calls[0] as [{ data: object }];
      expect(first.data).toEqual({ progressPercent: 100 });
      expect(tx.enrolment.updateMany).not.toHaveBeenCalled();
    });

    it("is 0% on a pathway with nothing published, not a division by zero", async () => {
      prisma.lesson.count.mockResolvedValue(0);
      prisma.lessonProgress.count.mockResolvedValue(0);

      await service.recomputePathway("pathway-1");

      const [first] = prisma.enrolment.update.mock.calls[0] as [{ data: object }];
      expect(first.data).toEqual({ progressPercent: 0 });
    });

    it("brings a changed module's status up to date for anyone who has one", async () => {
      // The module: three lessons, all done by enrolment-1 and one by enrolment-2.
      prisma.lesson.count.mockResolvedValueOnce(8).mockResolvedValueOnce(3);
      prisma.lessonProgress.count
        .mockResolvedValueOnce(3) // enrolment-1, module
        .mockResolvedValueOnce(5) // enrolment-1, pathway
        .mockResolvedValueOnce(1) // enrolment-2, module
        .mockResolvedValueOnce(2); // enrolment-2, pathway

      await service.recomputePathway("pathway-1", "module-1");

      // Completed only where it was not already, so the first date stands.
      expect(prisma.moduleProgress.updateMany).toHaveBeenCalledWith({
        where: { enrolmentId: "enrolment-1", moduleId: "module-1", status: { not: "COMPLETED" } },
        data: { status: "COMPLETED", completedAt: expect.any(Date) },
      });
      expect(prisma.moduleProgress.updateMany).toHaveBeenCalledWith({
        where: { enrolmentId: "enrolment-2", moduleId: "module-1" },
        data: { status: "IN_PROGRESS", completedAt: null },
      });
    });
  });

  /*
    A lesson made of scenes is completed by finishing them, not by a button:
    progress counts scenes, never time watched, as the production script asks.
  */
  describe("completeScene", () => {
    beforeEach(() => {
      prisma.lessonScene.findFirst.mockResolvedValue({
        id: "scene-2",
        lessonId: "lesson-1",
        lesson: { moduleId: "module-1", module: { pathwayId: "pathway-1" } },
      });
      tx.lessonScene.count.mockResolvedValue(3);
    });

    it("records the scene against the enrolment, keeping the first date", async () => {
      tx.sceneProgress.count.mockResolvedValue(1);

      await service.completeScene(learner, "scene-2");

      expect(tx.sceneProgress.upsert).toHaveBeenCalledWith({
        where: { enrolmentId_sceneId: { enrolmentId: "enrolment-1", sceneId: "scene-2" } },
        create: { enrolmentId: "enrolment-1", sceneId: "scene-2", completedAt: expect.any(Date) },
        update: {},
      });
    });

    it("marks the lesson under way until its last scene", async () => {
      tx.sceneProgress.count.mockResolvedValue(2);

      const result = await service.completeScene(learner, "scene-2");

      expect(result).toEqual({
        sceneId: "scene-2",
        scenesCompleted: 2,
        sceneCount: 3,
        lessonCompleted: false,
        progressPercent: null,
      });
      expect(tx.lessonProgress.upsert).toHaveBeenCalledWith({
        where: { enrolmentId_lessonId: { enrolmentId: "enrolment-1", lessonId: "lesson-1" } },
        create: {
          enrolmentId: "enrolment-1",
          lessonId: "lesson-1",
          status: "IN_PROGRESS",
          startedAt: expect.any(Date),
        },
        update: {},
      });
      expect(tx.lessonProgress.create).not.toHaveBeenCalled();
    });

    it("completes the lesson with its last scene, and says how far through the pathway", async () => {
      tx.sceneProgress.count.mockResolvedValue(3);
      counts(1, 1, 7, 2);

      const result = await service.completeScene(learner, "scene-2");

      expect(result).toMatchObject({ lessonCompleted: true, progressPercent: 29 });
      expect(tx.lessonProgress.create).toHaveBeenCalled();
    });

    it("counts only complete scenes of published lessons", async () => {
      tx.sceneProgress.count.mockResolvedValue(1);

      await service.completeScene(learner, "scene-2");

      const [args] = prisma.lessonScene.findFirst.mock.calls[0] as [{ where: object }];
      expect(args.where).toMatchObject({
        id: "scene-2",
        OR: expect.any(Array),
        lesson: { status: "PUBLISHED", archivedAt: null },
      });
    });

    it("is a 404 for a scene no learner can see", async () => {
      prisma.lessonScene.findFirst.mockResolvedValue(null);

      await expect(service.completeScene(learner, "scene-9")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("is a 404 for someone not enrolled on the pathway", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      await expect(service.completeScene(learner, "scene-2")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("lessonProgress", () => {
    it("says whether the caller is enrolled, and which scenes they have finished", async () => {
      prisma.lessonProgress.findUnique.mockResolvedValue({ status: "IN_PROGRESS" });
      prisma.sceneProgress.findMany.mockResolvedValue([{ sceneId: "scene-1" }, { sceneId: "scene-2" }]);

      await expect(service.lessonProgress(learner, "lesson-1")).resolves.toEqual({
        enrolled: true,
        status: "IN_PROGRESS",
        completedSceneIds: ["scene-1", "scene-2"],
      });
    });

    it("answers someone not enrolled rather than refusing them, since anyone may read a lesson", async () => {
      prisma.enrolment.findFirst.mockResolvedValue(null);

      await expect(service.lessonProgress(learner, "lesson-1")).resolves.toEqual({
        enrolled: false,
        status: "NOT_STARTED",
        completedSceneIds: [],
      });
    });

    it("is a 404 for a lesson that is not published", async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.lessonProgress(learner, "lesson-9")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
