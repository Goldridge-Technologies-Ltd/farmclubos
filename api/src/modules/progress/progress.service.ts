import { Injectable, NotFoundException } from "@nestjs/common";
import { readyScene } from "../academy/scene-readiness.js";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { ProgressStatus } from "../../generated/prisma/enums.js";
import { ownEnrolment } from "../../common/auth/own-enrolment.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import type {
  JourneyView,
  LessonCompletionView,
  LessonStandingView,
  ModuleProgressView,
  SceneCompletionView,
} from "./progress.types.js";

/*
  Recording and reading what a learner has actually done.

  Two rules hold everything else together.

  First, progress belongs to an *enrolment*, never to a user: the same person
  could take the same pathway twice with two institutions, and those are two
  separate records. Every write here resolves the enrolment from the caller,
  their active institution and the lesson's pathway — so a lesson id alone can
  never be used to write against someone else's record.

  Second, `progressPercent` is recomputed from rows rather than incremented.
  An increment drifts the moment anything else changes — a lesson published, a
  module archived — and a progress bar that quietly lies is worse than none.
*/

const published = { status: "PUBLISHED", archivedAt: null } as const;

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Marks a lesson complete for the caller's enrolment, then recomputes the
   * module's status and the enrolment's percentage from what is now recorded.
   */
  async completeLesson(
    user: AuthenticatedUser,
    lessonId: string,
  ): Promise<LessonCompletionView> {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, ...published, module: { ...published, pathway: published } },
      select: { id: true, moduleId: true, module: { select: { pathwayId: true } } },
    });

    if (!lesson) {
      throw notFound("lesson");
    }

    const enrolment = await this.enrolmentFor(user, lesson.module.pathwayId);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const { moduleStatus, progressPercent } = await this.recordLessonCompletion(
        tx,
        enrolment,
        lessonId,
        lesson.moduleId,
        now,
      );

      return {
        lessonId,
        status: "COMPLETED" as ProgressStatus,
        completedAt: now,
        moduleStatus,
        progressPercent,
      };
    });
  }

  /**
   * Records that the caller has finished one scene of a lesson. Finishing the
   * last completes the lesson: progress counts scenes, never time watched.
   * Only complete scenes of published lessons count — the same ones a learner
   * is shown — so a scene the content team is still building can never hold a
   * lesson open.
   */
  async completeScene(user: AuthenticatedUser, sceneId: string): Promise<SceneCompletionView> {
    const scene = await this.prisma.lessonScene.findFirst({
      where: {
        id: sceneId,
        ...readyScene,
        lesson: { ...published, module: { ...published, pathway: published } },
      },
      select: {
        id: true,
        lessonId: true,
        lesson: { select: { moduleId: true, module: { select: { pathwayId: true } } } },
      },
    });

    if (!scene) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "That scene does not exist, or has not been published.",
      });
    }

    const enrolment = await this.enrolmentFor(user, scene.lesson.module.pathwayId);
    const now = new Date();
    const lessonKey = { enrolmentId: enrolment.id, lessonId: scene.lessonId };

    return this.prisma.$transaction(async (tx) => {
      // Finishing a scene again — going back over a lesson — keeps the first date.
      await tx.sceneProgress.upsert({
        where: { enrolmentId_sceneId: { enrolmentId: enrolment.id, sceneId } },
        create: { enrolmentId: enrolment.id, sceneId, completedAt: now },
        update: {},
      });

      const [sceneCount, scenesCompleted] = await Promise.all([
        tx.lessonScene.count({ where: { lessonId: scene.lessonId, ...readyScene } }),
        tx.sceneProgress.count({
          where: { enrolmentId: enrolment.id, scene: { lessonId: scene.lessonId, ...readyScene } },
        }),
      ]);

      if (scenesCompleted < sceneCount) {
        // Under way. A lesson already completed stays completed.
        await tx.lessonProgress.upsert({
          where: { enrolmentId_lessonId: lessonKey },
          create: { ...lessonKey, status: "IN_PROGRESS", startedAt: now },
          update: {},
        });

        return { sceneId, scenesCompleted, sceneCount, lessonCompleted: false, progressPercent: null };
      }

      const { progressPercent } = await this.recordLessonCompletion(
        tx,
        enrolment,
        scene.lessonId,
        scene.lesson.moduleId,
        now,
      );

      return { sceneId, scenesCompleted, sceneCount, lessonCompleted: true, progressPercent };
    });
  }

  /**
   * Where the caller stands in one lesson. Anyone signed in may read a
   * published lesson, so someone not enrolled is answered, not refused: the
   * screen tells them nothing they do is recorded.
   */
  async lessonProgress(user: AuthenticatedUser, lessonId: string): Promise<LessonStandingView> {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, ...published, module: { ...published, pathway: published } },
      select: { id: true, module: { select: { pathwayId: true } } },
    });

    if (!lesson) {
      throw notFound("lesson");
    }

    const enrolment = await this.findEnrolment(user, lesson.module.pathwayId);

    if (!enrolment) {
      return { enrolled: false, status: "NOT_STARTED", completedSceneIds: [] };
    }

    const [row, scenes] = await Promise.all([
      this.prisma.lessonProgress.findUnique({
        where: { enrolmentId_lessonId: { enrolmentId: enrolment.id, lessonId } },
        select: { status: true },
      }),
      this.prisma.sceneProgress.findMany({
        where: { enrolmentId: enrolment.id, scene: { lessonId } },
        select: { sceneId: true },
      }),
    ]);

    return {
      enrolled: true,
      status: row?.status ?? "NOT_STARTED",
      completedSceneIds: scenes.map((item) => item.sceneId),
    };
  }

  /**
   * A lesson completed for an enrolment, then its module and the enrolment
   * recalculated. Completing twice is not an error — a second click, going
   * back over a lesson — and never moves the date it was first completed.
   */
  private async recordLessonCompletion(
    tx: Prisma.TransactionClient,
    enrolment: { id: string; pathwayId: string },
    lessonId: string,
    moduleId: string,
    now: Date,
  ): Promise<{ moduleStatus: ProgressStatus; progressPercent: number }> {
    const where = { enrolmentId_lessonId: { enrolmentId: enrolment.id, lessonId } };
    const existing = await tx.lessonProgress.findUnique({ where, select: { status: true } });

    if (!existing) {
      await tx.lessonProgress.create({
        data: {
          enrolmentId: enrolment.id,
          lessonId,
          status: "COMPLETED",
          startedAt: now,
          completedAt: now,
        },
      });
    } else if (existing.status !== "COMPLETED") {
      await tx.lessonProgress.update({ where, data: { status: "COMPLETED", completedAt: now } });
    }

    const moduleStatus = await this.refreshModule(tx, enrolment.id, moduleId, now);
    const progressPercent = await this.refreshEnrolment(tx, enrolment.id, enrolment.pathwayId, now);

    return { moduleStatus, progressPercent };
  }

  /**
   * Brings every enrolment on a pathway up to date after its content changed.
   * Publishing, unpublishing, archiving or restoring a lesson or module changes
   * how many lessons there are to complete; without this, a learner's
   * percentage would describe a pathway that no longer exists.
   *
   * Only the percentage is recalculated — and, when `moduleId` names the
   * module that changed, that module's status for anyone who has one. Whether
   * an enrolment has started or finished is left alone: that records what the
   * learner did, and a change of content does not undo it.
   */
  async recomputePathway(pathwayId: string, moduleId?: string): Promise<void> {
    const enrolments = await this.prisma.enrolment.findMany({
      where: { cohort: { pathwayId } },
      select: { id: true },
    });
    const total = await this.prisma.lesson.count({
      where: { ...published, module: { ...published, pathwayId } },
    });
    const moduleTotal = moduleId
      ? await this.prisma.lesson.count({ where: { moduleId, ...published } })
      : 0;
    const now = new Date();

    for (const { id: enrolmentId } of enrolments) {
      if (moduleId) {
        const done = await this.prisma.lessonProgress.count({
          where: { enrolmentId, status: "COMPLETED", lesson: { moduleId, ...published } },
        });
        const status = statusFor(done, moduleTotal);

        if (status === "COMPLETED") {
          // A module still complete keeps the date it was first completed.
          await this.prisma.moduleProgress.updateMany({
            where: { enrolmentId, moduleId, status: { not: "COMPLETED" } },
            data: { status, completedAt: now },
          });
        } else {
          await this.prisma.moduleProgress.updateMany({
            where: { enrolmentId, moduleId },
            data: { status, completedAt: null },
          });
        }
      }

      const completed = await this.prisma.lessonProgress.count({
        where: {
          enrolmentId,
          status: "COMPLETED",
          lesson: { ...published, module: { ...published, pathwayId } },
        },
      });

      await this.prisma.enrolment.update({
        where: { id: enrolmentId },
        data: { progressPercent: percentOf(completed, total) },
      });
    }
  }

  /** Every enrolment the caller holds, with what they have completed in each. */
  async myJourney(user: AuthenticatedUser): Promise<JourneyView[]> {
    if (!user.institutionId) {
      return [];
    }

    const enrolments = await this.prisma.enrolment.findMany({
      where: {
        ...ownEnrolment(user.userId, user.institutionId),
        status: { in: ["INVITED", "ACTIVE", "COMPLETED"] },
        cohort: { archivedAt: null },
      },
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        status: true,
        progressPercent: true,
        cohort: {
          select: {
            id: true,
            name: true,
            status: true,
            selfPaced: true,
            pathway: {
              select: {
                id: true,
                slug: true,
                title: true,
                modules: {
                  where: { ...published },
                  orderBy: { sequence: "asc" },
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    sequence: true,
                    lessons: {
                      where: { ...published },
                      orderBy: { sequence: "asc" },
                      select: { id: true, slug: true, title: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (enrolments.length === 0) {
      return [];
    }

    const progress = await this.prisma.lessonProgress.findMany({
      where: { enrolmentId: { in: enrolments.map((enrolment) => enrolment.id) } },
      select: { enrolmentId: true, lessonId: true, status: true, completedAt: true },
    });

    return enrolments.map((enrolment) => {
      const recorded = new Map(
        progress
          .filter((row) => row.enrolmentId === enrolment.id)
          .map((row) => [row.lessonId, row]),
      );

      const modules: ModuleProgressView[] = enrolment.cohort.pathway.modules.map(
        (pathwayModule) => {
          const lessons = pathwayModule.lessons.map((lesson) => {
            const row = recorded.get(lesson.id);

            return {
              lessonId: lesson.id,
              slug: lesson.slug,
              title: lesson.title,
              status: row?.status ?? "NOT_STARTED",
              completedAt: row?.completedAt ?? null,
            };
          });

          const lessonsCompleted = lessons.filter(
            (lesson) => lesson.status === "COMPLETED",
          ).length;

          return {
            moduleId: pathwayModule.id,
            slug: pathwayModule.slug,
            title: pathwayModule.title,
            sequence: pathwayModule.sequence,
            status: statusFor(lessonsCompleted, lessons.length),
            lessonsCompleted,
            lessonCount: lessons.length,
            lessons,
          };
        },
      );

      return {
        enrolmentId: enrolment.id,
        status: enrolment.status,
        progressPercent: enrolment.progressPercent,
        cohort: {
          id: enrolment.cohort.id,
          name: enrolment.cohort.name,
          status: enrolment.cohort.status,
          selfPaced: enrolment.cohort.selfPaced,
        },
        pathway: enrolment.cohort.pathway,
        modules,
      };
    });
  }

  /**
   * The caller's enrolment on a pathway, in the institution their token is
   * pinned to. A 404 rather than a 403: an id is never confirmed, and "you
   * are not enrolled" is not an authorisation failure.
   */
  private async enrolmentFor(
    user: AuthenticatedUser,
    pathwayId: string,
  ): Promise<{ id: string; pathwayId: string }> {
    const enrolment = await this.findEnrolment(user, pathwayId);

    if (!enrolment) {
      throw notFound("enrolment");
    }

    return enrolment;
  }

  /** The same, or null for someone with no open enrolment on the pathway. */
  private async findEnrolment(
    user: AuthenticatedUser,
    pathwayId: string,
  ): Promise<{ id: string; pathwayId: string } | null> {
    if (!user.institutionId) {
      return null;
    }

    const enrolment = await this.prisma.enrolment.findFirst({
      where: {
        ...ownEnrolment(user.userId, user.institutionId),
        status: { in: ["INVITED", "ACTIVE"] },
        cohort: { pathwayId, archivedAt: null },
      },
      orderBy: { enrolledAt: "desc" },
      select: { id: true },
    });

    return enrolment ? { id: enrolment.id, pathwayId } : null;
  }

  /** A module is complete when every published lesson in it is. */
  private async refreshModule(
    tx: Prisma.TransactionClient,
    enrolmentId: string,
    moduleId: string,
    now: Date,
  ): Promise<ProgressStatus> {
    const [total, completed] = await Promise.all([
      tx.lesson.count({ where: { moduleId, ...published } }),
      tx.lessonProgress.count({
        where: {
          enrolmentId,
          status: "COMPLETED",
          lesson: { moduleId, ...published },
        },
      }),
    ]);

    const status = statusFor(completed, total);

    await tx.moduleProgress.upsert({
      where: { enrolmentId_moduleId: { enrolmentId, moduleId } },
      create: {
        enrolmentId,
        moduleId,
        status,
        startedAt: now,
        completedAt: status === "COMPLETED" ? now : null,
      },
      update: { status, completedAt: status === "COMPLETED" ? now : null },
    });

    return status;
  }

  /** Recomputed from rows, never incremented. */
  private async refreshEnrolment(
    tx: Prisma.TransactionClient,
    enrolmentId: string,
    pathwayId: string,
    now: Date,
  ): Promise<number> {
    const [total, completed] = await Promise.all([
      tx.lesson.count({
        where: { ...published, module: { ...published, pathwayId } },
      }),
      tx.lessonProgress.count({
        where: {
          enrolmentId,
          status: "COMPLETED",
          lesson: { ...published, module: { ...published, pathwayId } },
        },
      }),
    ]);

    const progressPercent = percentOf(completed, total);
    const finished = total > 0 && completed === total;

    // Stamped once, on the first thing they complete. `updateMany` with the
    // condition in the where clause keeps it a single statement.
    await tx.enrolment.updateMany({
      where: { id: enrolmentId, startedAt: null },
      data: { startedAt: now, status: "ACTIVE" },
    });

    await tx.enrolment.update({
      where: { id: enrolmentId },
      data: {
        progressPercent,
        ...(finished ? { status: "COMPLETED", completedAt: now } : {}),
      },
    });

    return progressPercent;
  }
}

/**
 * Whole percent completed. A pathway with no published lessons is 0%, not
 * 100%: nothing has been done, and dividing by zero would claim otherwise.
 */
function percentOf(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function statusFor(completed: number, total: number): ProgressStatus {
  if (total > 0 && completed >= total) {
    return "COMPLETED";
  }

  return completed > 0 ? "IN_PROGRESS" : "NOT_STARTED";
}

function notFound(what: string) {
  return new NotFoundException({
    code: "NOT_FOUND",
    message:
      what === "enrolment"
        ? "You are not enrolled on this pathway."
        : "That lesson does not exist, or has not been published.",
  });
}
