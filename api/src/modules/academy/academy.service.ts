import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { StorageService } from "../../lib/storage/storage.service.js";
import type {
  AssessmentSummaryView,
  LessonDetailView,
  LessonLinkView,
  LessonSceneView,
  LessonSummaryView,
  ModuleDetailView,
  ModuleSummaryView,
  PathwayDetailView,
  PathwaySummaryView,
} from "./academy.types.js";
import { readyScene } from "./scene-readiness.js";

/*
  The Academy catalogue, read-only.

  Pathways are platform content and belong to no institution, so these are the
  few reads in the API with no institution filter (api/AGENTS.md's tenancy
  rule covers tenant-owned rows). What stands in its place is `published`,
  applied at every level: a module of an unpublished pathway is unreachable
  even by its own slug, because the query reaches it through the pathway.

  A miss is always a 404 — never a 403, which would confirm to a stranger that
  a slug exists.
*/

/** Only published, unarchived rows are ever visible here. */
const published = { status: "PUBLISHED", archivedAt: null } as const;

@Injectable()
export class AcademyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listPathways(): Promise<PathwaySummaryView[]> {
    const rows = await this.prisma.pathway.findMany({
      where: { ...published },
      orderBy: { sequence: "asc" },
      select: {
        ...pathwaySummarySelect,
        // Counting every module would promise seven and open three.
        _count: { select: { modules: { where: { ...published } } } },
      },
    });

    return rows.map(toPathwaySummary);
  }

  async getPathway(slug: string): Promise<PathwayDetailView> {
    const row = await this.prisma.pathway.findFirst({
      where: { slug, ...published },
      select: {
        ...pathwaySummarySelect,
        description: true,
        _count: { select: { modules: { where: { ...published } } } },
        modules: {
          where: { ...published },
          orderBy: { sequence: "asc" },
          select: moduleSummarySelect,
        },
      },
    });

    if (!row) {
      throw notFound("pathway");
    }

    return {
      ...toPathwaySummary(row),
      description: row.description,
      modules: row.modules.map(toModuleSummary),
    };
  }

  async getModule(pathwaySlug: string, moduleSlug: string): Promise<ModuleDetailView> {
    const row = await this.prisma.pathwayModule.findFirst({
      where: {
        slug: moduleSlug,
        ...published,
        // Reached through the pathway, so a module cannot be opened under
        // another pathway's slug, nor through an unpublished one.
        pathway: { slug: pathwaySlug, ...published },
      },
      select: {
        ...moduleSummarySelect,
        pathway: { select: { slug: true, title: true } },
        lessons: {
          where: { ...published },
          orderBy: { sequence: "asc" },
          select: lessonSummarySelect,
        },
        assessments: {
          where: { ...published },
          orderBy: { sequence: "asc" },
          select: {
            id: true,
            slug: true,
            title: true,
            kind: true,
            authoringStatus: true,
            passMarkPercent: true,
            // Questions are counted, never listed: an option carries
            // `isCorrect`, which is the answer key (api/AGENTS.md).
            _count: { select: { questions: true } },
          },
        },
      },
    });

    if (!row) {
      throw notFound("module");
    }

    return {
      ...toModuleSummary(row),
      pathway: row.pathway,
      lessons: row.lessons.map(toLessonSummary),
      assessments: row.assessments.map(toAssessmentSummary),
    };
  }

  async getLesson(
    pathwaySlug: string,
    moduleSlug: string,
    lessonSlug: string,
  ): Promise<LessonDetailView> {
    const row = await this.prisma.lesson.findFirst({
      where: {
        slug: lessonSlug,
        ...published,
        module: {
          slug: moduleSlug,
          ...published,
          pathway: { slug: pathwaySlug, ...published },
        },
      },
      select: {
        ...lessonSummarySelect,
        module: {
          select: {
            slug: true,
            title: true,
            pathway: { select: { slug: true, title: true } },
          },
        },
        // Only complete scenes: one still missing a file is the content team's.
        scenes: {
          where: readyScene,
          orderBy: { sequence: "asc" },
          select: {
            id: true,
            kind: true,
            title: true,
            body: true,
            transcript: true,
            video: { select: { storageKey: true, contentType: true } },
            captions: { select: { storageKey: true } },
            poster: { select: { storageKey: true } },
          },
        },
      },
    });

    if (!row) {
      throw notFound("lesson");
    }

    const [{ previous, next }, scenes] = await Promise.all([
      this.neighbours(row.id, moduleSlug, pathwaySlug),
      Promise.all(row.scenes.map((scene) => this.toScene(scene))),
    ]);

    return {
      ...toLessonSummary(row),
      scenes,
      pathway: row.module.pathway,
      module: { slug: row.module.slug, title: row.module.title },
      previous,
      next,
    };
  }

  /** A scene with signed links to its files, which expire rather than leak. */
  private async toScene(scene: {
    id: string;
    kind: LessonSceneView["kind"];
    title: string;
    body: string | null;
    transcript: string | null;
    video: { storageKey: string; contentType: string } | null;
    captions: { storageKey: string } | null;
    poster: { storageKey: string } | null;
  }): Promise<LessonSceneView> {
    const { video, captions, poster } = scene;

    return {
      id: scene.id,
      kind: scene.kind,
      title: scene.title,
      body: scene.body,
      transcript: scene.transcript,
      video:
        video && poster
          ? {
              url: await this.storage.signDownload(video.storageKey),
              contentType: video.contentType,
              captionsUrl: captions ? await this.storage.signDownload(captions.storageKey) : null,
              posterUrl: await this.storage.signDownload(poster.storageKey),
            }
          : null,
    };
  }

  /**
   * The lessons either side of this one, so a module reads as a sequence
   * rather than a list someone has to keep returning to.
   */
  private async neighbours(
    lessonId: string,
    moduleSlug: string,
    pathwaySlug: string,
  ): Promise<{ previous: LessonLinkView | null; next: LessonLinkView | null }> {
    const siblings = await this.prisma.lesson.findMany({
      where: {
        ...published,
        module: {
          slug: moduleSlug,
          ...published,
          pathway: { slug: pathwaySlug, ...published },
        },
      },
      orderBy: { sequence: "asc" },
      select: { id: true, slug: true, title: true },
    });

    const index = siblings.findIndex((lesson) => lesson.id === lessonId);

    return {
      previous: index > 0 ? toLessonLink(siblings[index - 1]) : null,
      next: index >= 0 && index < siblings.length - 1 ? toLessonLink(siblings[index + 1]) : null,
    };
  }
}

const pathwaySummarySelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  level: true,
  sequence: true,
} as const;

const moduleSummarySelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  sequence: true,
  _count: { select: { lessons: { where: published }, assessments: { where: published } } },
} as const;

const lessonSummarySelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  kind: true,
  authoringStatus: true,
  durationMinutes: true,
  sequence: true,
} as const;

type WithCount<T, K extends string> = T & { _count: Record<K, number> };

function toPathwaySummary(
  row: WithCount<Omit<PathwaySummaryView, "moduleCount">, "modules">,
): PathwaySummaryView {
  const { _count, ...pathway } = row;

  return { ...pathway, moduleCount: _count.modules };
}

function toModuleSummary(
  row: WithCount<Omit<ModuleSummaryView, "lessonCount" | "assessmentCount">, "lessons" | "assessments">,
): ModuleSummaryView {
  const { _count, ...pathwayModule } = row;

  return {
    ...pathwayModule,
    lessonCount: _count.lessons,
    assessmentCount: _count.assessments,
  };
}

function toLessonSummary(row: LessonSummaryView): LessonSummaryView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    kind: row.kind,
    authoringStatus: row.authoringStatus,
    durationMinutes: row.durationMinutes,
    sequence: row.sequence,
  };
}

function toAssessmentSummary(
  row: WithCount<Omit<AssessmentSummaryView, "questionCount">, "questions">,
): AssessmentSummaryView {
  const { _count, ...assessment } = row;

  return { ...assessment, questionCount: _count.questions };
}

function toLessonLink(lesson: { slug: string; title: string } | undefined): LessonLinkView | null {
  return lesson ? { slug: lesson.slug, title: lesson.title } : null;
}

function notFound(what: string) {
  return new NotFoundException({
    code: "NOT_FOUND",
    message: `That ${what} does not exist, or has not been published.`,
  });
}
