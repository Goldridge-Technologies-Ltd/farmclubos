import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { PublishStatus } from "../../generated/prisma/enums.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { isUniqueConstraintError } from "../../lib/database/prisma-errors.js";
import { readyScene, sceneGaps } from "../academy/scene-readiness.js";
import { ProgressService } from "../progress/progress.service.js";
import type {
  AuthoringLessonSummaryView,
  AuthoringLessonView,
  AuthoringModuleSummaryView,
  AuthoringModuleView,
  AuthoringPathwaySummaryView,
  AuthoringPathwayView,
  CurriculumItemInput,
  MoveDirection,
} from "./authoring.types.js";
import { ContentAccessService } from "./content-access.service.js";
import { slugFor } from "./slug.js";

/*
  The shape of the Academy below each pathway: its modules and their lessons,
  as the content team builds it.

  - Modules and lessons are archived, never deleted: learners' progress and
    attempts hang off them. Archiving returns one to draft, so restoring it
    never republishes anything by surprise.
  - A slug follows its title until first published, then stays fixed, so a
    learner's bookmark keeps working through a rename.
  - Publishing needs something to show: a lesson needs every scene complete,
    a module needs a published lesson.
  - Anything that changes how many lessons are published recalculates the
    progress of everyone on the pathway (ProgressService.recomputePathway).
  - Repeating an action — publishing what is published, saving an edit that
    changes nothing — is done, not an error, and not a second audit event.
*/
@Injectable()
export class CurriculumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ContentAccessService,
    private readonly progress: ProgressService,
  ) {}

  // ─── Pathways ─────────────────────────────────────────────────────────────

  async listPathways(user: AuthenticatedUser): Promise<AuthoringPathwaySummaryView[]> {
    await this.access.assertCanAuthor(user);

    const rows = await this.prisma.pathway.findMany({
      where: { archivedAt: null },
      orderBy: { sequence: "asc" },
      select: { ...pathwaySelect, modules: { select: countedSelect } },
    });

    return rows.map(toPathwaySummary);
  }

  async getPathway(user: AuthenticatedUser, pathwayId: string): Promise<AuthoringPathwayView> {
    await this.access.assertCanAuthor(user);

    const row = await this.prisma.pathway.findUnique({
      where: { id: pathwayId },
      select: {
        ...pathwaySelect,
        summary: true,
        modules: { orderBy: { sequence: "asc" }, select: moduleSelect },
      },
    });

    if (!row) {
      throw notFound("pathway");
    }

    return {
      ...toPathwaySummary(row),
      summary: row.summary,
      modules: row.modules.map(toModuleSummary),
    };
  }

  // ─── Modules ──────────────────────────────────────────────────────────────

  async createModule(
    user: AuthenticatedUser,
    pathwayId: string,
    input: CurriculumItemInput & { title: string },
  ): Promise<AuthoringModuleSummaryView> {
    await this.access.assertCanAuthor(user);

    const pathway = await this.prisma.pathway.findUnique({
      where: { id: pathwayId },
      select: { id: true },
    });

    if (!pathway) {
      throw notFound("pathway");
    }

    const siblings = await this.prisma.pathwayModule.findMany({
      where: { pathwayId },
      select: { slug: true, sequence: true },
    });

    const created = await this.prisma
      .$transaction(async (tx) => {
        const row = await tx.pathwayModule.create({
          data: {
            pathwayId,
            title: input.title,
            slug: slugFor(input.title, "module", new Set(siblings.map((item) => item.slug))),
            summary: clean(input.summary) ?? null,
            sequence: nextSequence(siblings),
            status: "DRAFT",
          },
          select: moduleSelect,
        });

        await audit(tx, user.userId, "module.created", "PathwayModule", row.id);

        return row;
      })
      .catch(rethrowSlugTaken);

    return toModuleSummary(created);
  }

  async getModule(user: AuthenticatedUser, moduleId: string): Promise<AuthoringModuleView> {
    await this.access.assertCanAuthor(user);

    const row = await this.prisma.pathwayModule.findUnique({
      where: { id: moduleId },
      select: {
        ...moduleSelect,
        pathway: { select: { id: true, slug: true, title: true } },
        lessons: { orderBy: { sequence: "asc" }, select: lessonListSelect },
      },
    });

    if (!row) {
      throw notFound("module");
    }

    const counts = await this.sceneCounts(row.lessons.map((lesson) => lesson.id));

    return {
      ...toModuleSummary(row),
      pathway: row.pathway,
      lessons: row.lessons.map((lesson) => ({
        ...lessonFields(lesson),
        sceneCount: counts.total.get(lesson.id) ?? 0,
        readySceneCount: counts.ready.get(lesson.id) ?? 0,
      })),
    };
  }

  async updateModule(
    user: AuthenticatedUser,
    moduleId: string,
    input: CurriculumItemInput,
  ): Promise<AuthoringModuleSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findModule(moduleId);
    const data: Prisma.PathwayModuleUpdateInput = {};

    if (input.title !== undefined && input.title !== current.title) {
      data.title = input.title;

      if (slugFollowsTitle(current)) {
        const siblings = await this.prisma.pathwayModule.findMany({
          where: { pathwayId: current.pathwayId, id: { not: moduleId } },
          select: { slug: true },
        });
        const slug = slugFor(input.title, "module", new Set(siblings.map((item) => item.slug)));

        if (slug !== current.slug) {
          data.slug = slug;
        }
      }
    }

    const summary = clean(input.summary);

    if (summary !== undefined && summary !== current.summary) {
      data.summary = summary;
    }

    if (Object.keys(data).length === 0) {
      return toModuleSummary(current);
    }

    const updated = await this.prisma
      .$transaction(async (tx) => {
        const row = await tx.pathwayModule.update({
          where: { id: moduleId },
          data,
          select: moduleSelect,
        });

        await audit(tx, user.userId, "module.updated", "PathwayModule", moduleId, {
          fields: Object.keys(data),
        });

        return row;
      })
      .catch(rethrowSlugTaken);

    return toModuleSummary(updated);
  }

  async moveModule(
    user: AuthenticatedUser,
    moduleId: string,
    direction: MoveDirection,
  ): Promise<AuthoringModuleSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findModule(moduleId);
    const siblings = await this.prisma.pathwayModule.findMany({
      where: { pathwayId: current.pathwayId, archivedAt: null },
      orderBy: [{ sequence: "asc" }, { id: "asc" }],
      select: { id: true, sequence: true },
    });
    const changes = reorder(siblings, moduleId, direction);

    if (changes.length === 0) {
      return toModuleSummary(current);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const change of changes) {
        await tx.pathwayModule.update({
          where: { id: change.id },
          data: { sequence: change.sequence },
        });
      }

      await audit(tx, user.userId, "module.moved", "PathwayModule", moduleId, { direction });
    });

    return toModuleSummary(await this.findModule(moduleId));
  }

  async publishModule(user: AuthenticatedUser, moduleId: string): Promise<AuthoringModuleSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findModule(moduleId);

    if (current.archivedAt) {
      throw archived("module");
    }

    if (!current.lessons.some((lesson) => lesson.status === "PUBLISHED" && !lesson.archivedAt)) {
      throw new BadRequestException({
        code: "MODULE_EMPTY",
        message: "Publish at least one of this module's lessons first, so learners have something to open.",
      });
    }

    if (current.status === "PUBLISHED") {
      return toModuleSummary(current);
    }

    const updated = await this.changeModule(user, moduleId, "module.published", {
      status: "PUBLISHED",
      publishedAt: current.publishedAt ?? new Date(),
    });

    await this.progress.recomputePathway(current.pathwayId);

    return toModuleSummary(updated);
  }

  async unpublishModule(user: AuthenticatedUser, moduleId: string): Promise<AuthoringModuleSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findModule(moduleId);

    if (current.status !== "PUBLISHED") {
      return toModuleSummary(current);
    }

    const updated = await this.changeModule(user, moduleId, "module.unpublished", {
      status: "DRAFT",
    });

    await this.progress.recomputePathway(current.pathwayId);

    return toModuleSummary(updated);
  }

  async archiveModule(user: AuthenticatedUser, moduleId: string): Promise<AuthoringModuleSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findModule(moduleId);

    if (current.archivedAt) {
      return toModuleSummary(current);
    }

    const updated = await this.changeModule(user, moduleId, "module.archived", {
      archivedAt: new Date(),
      status: "DRAFT",
    });

    if (current.status === "PUBLISHED") {
      await this.progress.recomputePathway(current.pathwayId);
    }

    return toModuleSummary(updated);
  }

  async restoreModule(user: AuthenticatedUser, moduleId: string): Promise<AuthoringModuleSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findModule(moduleId);

    if (!current.archivedAt) {
      return toModuleSummary(current);
    }

    // Back at the end of the list: its old place may belong to another now.
    const siblings = await this.prisma.pathwayModule.findMany({
      where: { pathwayId: current.pathwayId, id: { not: moduleId } },
      select: { sequence: true },
    });

    const updated = await this.changeModule(user, moduleId, "module.restored", {
      archivedAt: null,
      sequence: nextSequence(siblings),
    });

    return toModuleSummary(updated);
  }

  // ─── Lessons ──────────────────────────────────────────────────────────────

  async createLesson(
    user: AuthenticatedUser,
    moduleId: string,
    input: CurriculumItemInput & { title: string },
  ): Promise<AuthoringLessonSummaryView> {
    await this.access.assertCanAuthor(user);
    await this.findModule(moduleId);

    const siblings = await this.prisma.lesson.findMany({
      where: { moduleId },
      select: { slug: true, sequence: true },
    });

    const created = await this.prisma
      .$transaction(async (tx) => {
        const row = await tx.lesson.create({
          data: {
            moduleId,
            title: input.title,
            slug: slugFor(input.title, "lesson", new Set(siblings.map((item) => item.slug))),
            summary: clean(input.summary) ?? null,
            sequence: nextSequence(siblings),
            status: "DRAFT",
            kind: "TEXT",
            authoringStatus: "PLACEHOLDER",
          },
          select: lessonSelect,
        });

        await audit(tx, user.userId, "lesson.created", "Lesson", row.id);

        return row;
      })
      .catch(rethrowSlugTaken);

    return toLessonSummary(created);
  }

  async getLesson(user: AuthenticatedUser, lessonId: string): Promise<AuthoringLessonView> {
    await this.access.assertCanAuthor(user);

    const row = await this.findLesson(lessonId);

    return {
      ...toLessonSummary(row),
      module: {
        id: row.module.id,
        slug: row.module.slug,
        title: row.module.title,
        status: row.module.status,
      },
      pathway: row.module.pathway,
      scenes: row.scenes.map((scene) => ({
        id: scene.id,
        kind: scene.kind,
        sequence: scene.sequence,
        title: scene.title,
        gaps: sceneGaps(scene),
      })),
    };
  }

  async updateLesson(
    user: AuthenticatedUser,
    lessonId: string,
    input: CurriculumItemInput,
  ): Promise<AuthoringLessonSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findLesson(lessonId);
    const data: Prisma.LessonUpdateInput = {};

    if (input.title !== undefined && input.title !== current.title) {
      data.title = input.title;

      if (slugFollowsTitle(current)) {
        const siblings = await this.prisma.lesson.findMany({
          where: { moduleId: current.moduleId, id: { not: lessonId } },
          select: { slug: true },
        });
        const slug = slugFor(input.title, "lesson", new Set(siblings.map((item) => item.slug)));

        if (slug !== current.slug) {
          data.slug = slug;
        }
      }
    }

    const summary = clean(input.summary);

    if (summary !== undefined && summary !== current.summary) {
      data.summary = summary;
    }

    if (Object.keys(data).length === 0) {
      return toLessonSummary(current);
    }

    const updated = await this.prisma
      .$transaction(async (tx) => {
        const row = await tx.lesson.update({ where: { id: lessonId }, data, select: lessonSelect });

        await audit(tx, user.userId, "lesson.updated", "Lesson", lessonId, {
          fields: Object.keys(data),
        });

        return row;
      })
      .catch(rethrowSlugTaken);

    return toLessonSummary(updated);
  }

  async moveLesson(
    user: AuthenticatedUser,
    lessonId: string,
    direction: MoveDirection,
  ): Promise<AuthoringLessonSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findLesson(lessonId);
    const siblings = await this.prisma.lesson.findMany({
      where: { moduleId: current.moduleId, archivedAt: null },
      orderBy: [{ sequence: "asc" }, { id: "asc" }],
      select: { id: true, sequence: true },
    });
    const changes = reorder(siblings, lessonId, direction);

    if (changes.length === 0) {
      return toLessonSummary(current);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const change of changes) {
        await tx.lesson.update({ where: { id: change.id }, data: { sequence: change.sequence } });
      }

      await audit(tx, user.userId, "lesson.moved", "Lesson", lessonId, { direction });
    });

    return toLessonSummary(await this.findLesson(lessonId));
  }

  async publishLesson(user: AuthenticatedUser, lessonId: string): Promise<AuthoringLessonSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findLesson(lessonId);

    if (current.archivedAt) {
      throw archived("lesson");
    }

    if (current.scenes.length === 0) {
      throw new BadRequestException({
        code: "LESSON_EMPTY",
        message: "Add at least one scene before publishing this lesson.",
      });
    }

    const unfinished = current.scenes.filter((scene) => sceneGaps(scene).length > 0);

    if (unfinished.length > 0) {
      throw new BadRequestException({
        code: "LESSON_INCOMPLETE",
        message: `Finish ${listOf(unfinished.map((scene) => `“${scene.title}”`))} before publishing this lesson.`,
      });
    }

    if (current.status === "PUBLISHED") {
      return toLessonSummary(current);
    }

    const updated = await this.changeLesson(user, lessonId, "lesson.published", {
      status: "PUBLISHED",
      publishedAt: current.publishedAt ?? new Date(),
      authoringStatus: "AUTHORED",
    });

    await this.progress.recomputePathway(current.module.pathwayId, current.moduleId);

    return toLessonSummary(updated);
  }

  async unpublishLesson(user: AuthenticatedUser, lessonId: string): Promise<AuthoringLessonSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findLesson(lessonId);

    if (current.status !== "PUBLISHED") {
      return toLessonSummary(current);
    }

    const updated = await this.changeLesson(user, lessonId, "lesson.unpublished", {
      status: "DRAFT",
    });

    await this.progress.recomputePathway(current.module.pathwayId, current.moduleId);

    return toLessonSummary(updated);
  }

  async archiveLesson(user: AuthenticatedUser, lessonId: string): Promise<AuthoringLessonSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findLesson(lessonId);

    if (current.archivedAt) {
      return toLessonSummary(current);
    }

    const updated = await this.changeLesson(user, lessonId, "lesson.archived", {
      archivedAt: new Date(),
      status: "DRAFT",
    });

    if (current.status === "PUBLISHED") {
      await this.progress.recomputePathway(current.module.pathwayId, current.moduleId);
    }

    return toLessonSummary(updated);
  }

  async restoreLesson(user: AuthenticatedUser, lessonId: string): Promise<AuthoringLessonSummaryView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findLesson(lessonId);

    if (!current.archivedAt) {
      return toLessonSummary(current);
    }

    const siblings = await this.prisma.lesson.findMany({
      where: { moduleId: current.moduleId, id: { not: lessonId } },
      select: { sequence: true },
    });

    const updated = await this.changeLesson(user, lessonId, "lesson.restored", {
      archivedAt: null,
      sequence: nextSequence(siblings),
    });

    return toLessonSummary(updated);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async findModule(moduleId: string) {
    const row = await this.prisma.pathwayModule.findUnique({
      where: { id: moduleId },
      select: moduleSelect,
    });

    if (!row) {
      throw notFound("module");
    }

    return row;
  }

  private async findLesson(lessonId: string) {
    const row = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: lessonSelect,
    });

    if (!row) {
      throw notFound("lesson");
    }

    return row;
  }

  private changeModule(
    user: AuthenticatedUser,
    moduleId: string,
    action: string,
    data: Prisma.PathwayModuleUpdateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.pathwayModule.update({ where: { id: moduleId }, data, select: moduleSelect });

      await audit(tx, user.userId, action, "PathwayModule", moduleId);

      return row;
    });
  }

  private changeLesson(
    user: AuthenticatedUser,
    lessonId: string,
    action: string,
    data: Prisma.LessonUpdateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.lesson.update({ where: { id: lessonId }, data, select: lessonSelect });

      await audit(tx, user.userId, action, "Lesson", lessonId);

      return row;
    });
  }

  /** How many scenes each lesson has, and how many are complete. */
  private async sceneCounts(lessonIds: string[]) {
    if (lessonIds.length === 0) {
      return { total: new Map<string, number>(), ready: new Map<string, number>() };
    }

    const [total, ready] = await Promise.all([
      this.prisma.lessonScene.groupBy({
        by: ["lessonId"],
        where: { lessonId: { in: lessonIds } },
        _count: { _all: true },
      }),
      this.prisma.lessonScene.groupBy({
        by: ["lessonId"],
        where: { lessonId: { in: lessonIds }, ...readyScene },
        _count: { _all: true },
      }),
    ]);

    const byLesson = (rows: { lessonId: string; _count: { _all: number } }[]) =>
      new Map(rows.map((row) => [row.lessonId, row._count._all]));

    return { total: byLesson(total), ready: byLesson(ready) };
  }
}

// ─── Selections and views ───────────────────────────────────────────────────

const countedSelect = { status: true, archivedAt: true } as const;

const pathwaySelect = { id: true, slug: true, title: true, status: true } as const;

const moduleSelect = {
  id: true,
  pathwayId: true,
  slug: true,
  title: true,
  summary: true,
  sequence: true,
  status: true,
  publishedAt: true,
  archivedAt: true,
  lessons: { select: countedSelect },
} as const;

const lessonListSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  sequence: true,
  status: true,
  publishedAt: true,
  archivedAt: true,
  kind: true,
  authoringStatus: true,
} as const;

const lessonSelect = {
  ...lessonListSelect,
  moduleId: true,
  module: {
    select: {
      id: true,
      pathwayId: true,
      slug: true,
      title: true,
      status: true,
      pathway: { select: { id: true, slug: true, title: true } },
    },
  },
  scenes: {
    orderBy: { sequence: "asc" },
    select: {
      id: true,
      kind: true,
      sequence: true,
      title: true,
      body: true,
      videoAssetId: true,
      captionsAssetId: true,
      posterAssetId: true,
    },
  },
} as const;

type Counted = { status: PublishStatus; archivedAt: Date | null };

function countOf(items: Counted[]) {
  const live = items.filter((item) => !item.archivedAt);

  return { all: live.length, published: live.filter((item) => item.status === "PUBLISHED").length };
}

function toPathwaySummary(row: {
  id: string;
  slug: string;
  title: string;
  status: PublishStatus;
  modules: Counted[];
}): AuthoringPathwaySummaryView {
  const counts = countOf(row.modules);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    moduleCount: counts.all,
    publishedModuleCount: counts.published,
  };
}

type ModuleRow = Prisma.PathwayModuleGetPayload<{ select: typeof moduleSelect }>;

function toModuleSummary(row: ModuleRow): AuthoringModuleSummaryView {
  const counts = countOf(row.lessons);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    sequence: row.sequence,
    status: row.status,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    lessonCount: counts.all,
    publishedLessonCount: counts.published,
  };
}

type LessonListRow = Prisma.LessonGetPayload<{ select: typeof lessonListSelect }>;
type LessonRow = Prisma.LessonGetPayload<{ select: typeof lessonSelect }>;

function lessonFields(row: LessonListRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    sequence: row.sequence,
    status: row.status,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    kind: row.kind,
    authoringStatus: row.authoringStatus,
  };
}

function toLessonSummary(row: LessonRow): AuthoringLessonSummaryView {
  return {
    ...lessonFields(row),
    sceneCount: row.scenes.length,
    readySceneCount: row.scenes.filter((scene) => sceneGaps(scene).length === 0).length,
  };
}

// ─── Small rules ────────────────────────────────────────────────────────────

/** Until first published, nothing links to it, so its slug may follow its title. */
function slugFollowsTitle(row: { status: PublishStatus; publishedAt: Date | null }): boolean {
  return row.status === "DRAFT" && !row.publishedAt;
}

/** After the last, counting archived siblings, so a restore never collides. */
function nextSequence(siblings: { sequence: number }[]): number {
  return siblings.reduce((max, item) => Math.max(max, item.sequence), 0) + 1;
}

/**
 * The sequence changes that move one item up or down among its siblings,
 * numbering them 1…n as it goes so ties from older data sort themselves out.
 * Empty when it is already at that end.
 */
export function reorder(
  siblings: { id: string; sequence: number }[],
  id: string,
  direction: MoveDirection,
): { id: string; sequence: number }[] {
  const from = siblings.findIndex((item) => item.id === id);
  const to = direction === "UP" ? from - 1 : from + 1;

  if (from === -1 || to < 0 || to >= siblings.length) {
    return [];
  }

  const order = [...siblings];
  [order[from], order[to]] = [order[to], order[from]];

  return order
    .map((item, index) => ({ id: item.id, sequence: index + 1, was: item.sequence }))
    .filter((item) => item.sequence !== item.was)
    .map(({ id: changed, sequence }) => ({ id: changed, sequence }));
}

/** Trimmed; empty becomes null, and undefined stays "not sent". */
function clean(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value?.trim() ?? "";

  return trimmed === "" ? null : trimmed;
}

/** “A”, “A and B”, “A, B and C”. */
function listOf(items: string[]): string {
  return items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

async function audit(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Prisma.InputJsonValue,
): Promise<void> {
  await tx.auditEvent.create({ data: { actorUserId, action, entityType, entityId, metadata } });
}

function notFound(what: string) {
  return new NotFoundException({ code: "NOT_FOUND", message: `That ${what} does not exist.` });
}

function archived(what: string) {
  return new BadRequestException({
    code: "ARCHIVED",
    message: `This ${what} is archived. Restore it before publishing it.`,
  });
}

function rethrowSlugTaken(error: unknown): never {
  if (isUniqueConstraintError(error)) {
    throw new ConflictException({
      code: "SLUG_TAKEN",
      message: "Something with the same name was added at the same moment. Try again.",
    });
  }

  throw error;
}
