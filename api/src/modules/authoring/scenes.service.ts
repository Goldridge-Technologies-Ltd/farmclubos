import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { LessonSceneKind, MediaPurpose } from "../../generated/prisma/enums.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { StorageService } from "../../lib/storage/storage.service.js";
import { sceneGaps } from "../academy/scene-readiness.js";
import { audit, clean, nextSequence, notFound, reorder } from "./authoring.helpers.js";
import type {
  AuthoringSceneView,
  LessonPreviewView,
  MediaFileView,
  MoveDirection,
  PreviewSceneView,
  SceneInput,
  UploadRequestInput,
  UploadTicketView,
} from "./authoring.types.js";
import { transcriptFromVtt } from "./captions.js";
import { ContentAccessService } from "./content-access.service.js";
import { MEDIA_RULES } from "./media-rules.js";

/** Which column and relation of a scene each kind of file fills. */
const SLOTS = {
  VIDEO: { column: "videoAssetId", relation: "video" },
  CAPTIONS: { column: "captionsAssetId", relation: "captions" },
  POSTER: { column: "posterAssetId", relation: "poster" },
} as const satisfies Record<MediaPurpose, { column: string; relation: string }>;

/*
  The scenes inside a lesson, and the files a video scene carries.

  A file never passes through this API. Asking to upload creates a PENDING
  record and a signed link to storage; the browser sends the file there; then
  finishing the upload checks what arrived — that it is there, is the size and
  type the link was signed for, and for captions, that it really is WebVTT —
  before attaching it to the scene. Only then does it replace what was there,
  and the file it replaced is deleted from storage.

  Storage keys are made here, from ids. The name a file was uploaded with is
  kept only to show the content team, never used as a path.
*/
@Injectable()
export class ScenesService {
  private readonly logger = new Logger(ScenesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ContentAccessService,
    private readonly storage: StorageService,
  ) {}

  async createScene(
    user: AuthenticatedUser,
    lessonId: string,
    input: { kind: LessonSceneKind; title: string },
  ): Promise<AuthoringSceneView> {
    await this.access.assertCanAuthor(user);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, kind: true },
    });

    if (!lesson) {
      throw notFound("lesson");
    }

    const siblings = await this.prisma.lessonScene.findMany({
      where: { lessonId },
      select: { sequence: true },
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.lessonScene.create({
        data: { lessonId, kind: input.kind, title: input.title, sequence: nextSequence(siblings) },
        select: { id: true },
      });

      await audit(tx, user.userId, "scene.created", "LessonScene", row.id, {
        lessonId,
        kind: input.kind,
      });
      await syncLessonKind(tx, lessonId);

      return row;
    });

    return this.view(created.id);
  }

  async getScene(user: AuthenticatedUser, sceneId: string): Promise<AuthoringSceneView> {
    await this.access.assertCanAuthor(user);

    return this.toView(await this.findScene(sceneId));
  }

  async updateScene(
    user: AuthenticatedUser,
    sceneId: string,
    input: SceneInput,
  ): Promise<AuthoringSceneView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findScene(sceneId);
    const data: Prisma.LessonSceneUpdateInput = {};

    if (input.title !== undefined && input.title !== current.title) {
      data.title = input.title;
    }

    const body = clean(input.body);

    if (body !== undefined && body !== current.body) {
      data.body = body;
    }

    if (Object.keys(data).length === 0) {
      return this.toView(current);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.lessonScene.update({ where: { id: sceneId }, data });
      await audit(tx, user.userId, "scene.updated", "LessonScene", sceneId, {
        fields: Object.keys(data),
      });
    });

    return this.view(sceneId);
  }

  async moveScene(
    user: AuthenticatedUser,
    sceneId: string,
    direction: MoveDirection,
  ): Promise<AuthoringSceneView> {
    await this.access.assertCanAuthor(user);

    const current = await this.findScene(sceneId);
    const siblings = await this.prisma.lessonScene.findMany({
      where: { lessonId: current.lessonId },
      orderBy: [{ sequence: "asc" }, { id: "asc" }],
      select: { id: true, sequence: true },
    });
    const changes = reorder(siblings, sceneId, direction);

    if (changes.length === 0) {
      return this.toView(current);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const change of changes) {
        await tx.lessonScene.update({ where: { id: change.id }, data: { sequence: change.sequence } });
      }

      await audit(tx, user.userId, "scene.moved", "LessonScene", sceneId, { direction });
    });

    return this.view(sceneId);
  }

  /**
   * Deletes a scene, its files and learners' records of having seen it. Unlike
   * a lesson it holds no evidence of work: "seen this screen" is all there is.
   */
  async removeScene(user: AuthenticatedUser, sceneId: string): Promise<{ id: string }> {
    await this.access.assertCanAuthor(user);

    const current = await this.findScene(sceneId);
    const files = await this.prisma.mediaAsset.findMany({
      where: { sceneId },
      select: { storageKey: true },
    });

    // The records go first: a scene must never point at a file already gone.
    await this.prisma.$transaction(async (tx) => {
      await tx.lessonScene.delete({ where: { id: sceneId } });
      await audit(tx, user.userId, "scene.removed", "LessonScene", sceneId, {
        lessonId: current.lessonId,
        title: current.title,
      });
      await syncLessonKind(tx, current.lessonId);
    });

    for (const file of files) {
      await this.removeQuietly(file.storageKey);
    }

    return { id: sceneId };
  }

  /** A signed link the browser uploads one file to, and the record awaiting it. */
  async requestUpload(
    user: AuthenticatedUser,
    sceneId: string,
    input: UploadRequestInput,
  ): Promise<UploadTicketView> {
    await this.access.assertCanAuthor(user);

    const scene = await this.findScene(sceneId);

    if (scene.kind !== "VIDEO") {
      throw new BadRequestException({
        code: "WRONG_SCENE_KIND",
        message: "A notes scene has no files. Add a video scene for a video.",
      });
    }

    const rule = MEDIA_RULES[input.purpose];
    const extension = rule.types[input.contentType];

    if (!extension) {
      throw new BadRequestException({ code: "FILE_TYPE", message: `This needs ${rule.expected}.` });
    }

    if (input.sizeBytes > rule.maxBytes) {
      throw new BadRequestException({
        code: "FILE_TOO_LARGE",
        message: `That file is ${sizeOf(input.sizeBytes)}; this takes up to ${sizeOf(rule.maxBytes)}.`,
      });
    }

    // A new upload to a slot supersedes one that was asked for and never finished.
    const stale = await this.prisma.mediaAsset.findMany({
      where: { sceneId, purpose: input.purpose, status: "PENDING" },
      select: { id: true, storageKey: true },
    });

    if (stale.length > 0) {
      for (const file of stale) {
        await this.removeQuietly(file.storageKey);
      }

      await this.prisma.mediaAsset.deleteMany({ where: { id: { in: stale.map((file) => file.id) } } });
    }

    const storageKey =
      `lessons/${scene.lessonId}/scenes/${sceneId}/` +
      `${input.purpose.toLowerCase()}/${randomUUID()}.${extension}`;

    const asset = await this.prisma.mediaAsset.create({
      data: {
        sceneId,
        purpose: input.purpose,
        status: "PENDING",
        storageKey,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        fileName: input.fileName.trim().slice(0, 255),
        uploadedById: user.userId,
      },
      select: { id: true },
    });
    const ticket = await this.storage.signUpload(storageKey, input.contentType, input.sizeBytes);

    return {
      assetId: asset.id,
      url: ticket.url,
      method: "PUT",
      headers: ticket.headers,
      expiresAt: ticket.expiresAt,
    };
  }

  /** Checks what arrived and, if it is what was signed for, attaches it. */
  async completeUpload(user: AuthenticatedUser, assetId: string): Promise<AuthoringSceneView> {
    await this.access.assertCanAuthor(user);

    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        sceneId: true,
        purpose: true,
        status: true,
        storageKey: true,
        contentType: true,
        sizeBytes: true,
      },
    });

    if (!asset) {
      throw notFound("upload");
    }

    // Finishing twice — a double click, a retried request — is done.
    if (asset.status === "READY") {
      return this.view(asset.sceneId);
    }

    const stored = await this.storage.inspect(asset.storageKey);

    if (!stored) {
      await this.prisma.mediaAsset.delete({ where: { id: assetId } });

      throw new BadRequestException({
        code: "UPLOAD_MISSING",
        message: "The file did not reach storage. Upload it again.",
      });
    }

    if (stored.sizeBytes !== asset.sizeBytes || stored.contentType !== asset.contentType) {
      await this.discard(asset);

      throw new BadRequestException({
        code: "UPLOAD_MISMATCH",
        message: "What arrived is not the file that was chosen. Upload it again.",
      });
    }

    let transcript: string | undefined;

    if (asset.purpose === "CAPTIONS") {
      const parsed = transcriptFromVtt(await this.storage.readText(asset.storageKey));

      if (!parsed) {
        await this.discard(asset);

        throw new BadRequestException({
          code: "CAPTIONS_INVALID",
          message:
            "That is not a WebVTT captions file with captions in it. Export the captions as " +
            ".vtt and upload them again.",
        });
      }

      transcript = parsed;
    }

    const scene = await this.findScene(asset.sceneId);
    const slot = SLOTS[asset.purpose];
    const replaced = scene[slot.relation];

    await this.prisma.$transaction(async (tx) => {
      await tx.mediaAsset.update({
        where: { id: assetId },
        data: { status: "READY", readyAt: new Date() },
      });
      await tx.lessonScene.update({
        where: { id: scene.id },
        data: { [slot.column]: assetId, ...(transcript === undefined ? {} : { transcript }) },
      });

      if (replaced) {
        await tx.mediaAsset.delete({ where: { id: replaced.id } });
      }

      await audit(tx, user.userId, "scene.file_uploaded", "LessonScene", scene.id, {
        purpose: asset.purpose,
        assetId,
      });
    });

    if (replaced) {
      await this.removeQuietly(replaced.storageKey);
    }

    return this.view(scene.id);
  }

  /**
   * A whole lesson as learners will see it, scene by scene, for the content
   * team to go through before publishing. Unlike a learner's view it keeps
   * the scenes learners would not see yet, each saying what it still needs,
   * and plays a video before its still image is added. Nothing is recorded.
   */
  async previewLesson(user: AuthenticatedUser, lessonId: string): Promise<LessonPreviewView> {
    await this.access.assertCanAuthor(user);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: previewSelect,
    });

    if (!lesson) {
      throw notFound("lesson");
    }

    return {
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary,
      kind: lesson.kind,
      status: lesson.status,
      archivedAt: lesson.archivedAt,
      module: { id: lesson.module.id, title: lesson.module.title },
      pathway: lesson.module.pathway,
      scenes: await Promise.all(lesson.scenes.map((scene) => this.toPreviewScene(scene))),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async findScene(sceneId: string) {
    const scene = await this.prisma.lessonScene.findUnique({
      where: { id: sceneId },
      select: sceneSelect,
    });

    if (!scene) {
      throw notFound("scene");
    }

    return scene;
  }

  private async view(sceneId: string): Promise<AuthoringSceneView> {
    return this.toView(await this.findScene(sceneId));
  }

  private async toView(scene: SceneRow): Promise<AuthoringSceneView> {
    const [video, captions, poster] = await Promise.all([
      this.file(scene.video),
      this.file(scene.captions),
      this.file(scene.poster),
    ]);

    return {
      id: scene.id,
      kind: scene.kind,
      sequence: scene.sequence,
      title: scene.title,
      body: scene.body,
      transcript: scene.transcript,
      gaps: sceneGaps(scene),
      lesson: { id: scene.lesson.id, title: scene.lesson.title, status: scene.lesson.status },
      module: { id: scene.lesson.module.id, title: scene.lesson.module.title },
      pathway: scene.lesson.module.pathway,
      video,
      captions,
      poster,
    };
  }

  private async file(asset: FileRow | null): Promise<MediaFileView | null> {
    if (!asset) {
      return null;
    }

    return {
      id: asset.id,
      fileName: asset.fileName,
      contentType: asset.contentType,
      sizeBytes: asset.sizeBytes,
      uploadedAt: asset.readyAt ?? asset.createdAt,
      url: await this.storage.signDownload(asset.storageKey),
    };
  }

  private async toPreviewScene(scene: PreviewSceneRow): Promise<PreviewSceneView> {
    const { video, captions, poster } = scene;

    return {
      id: scene.id,
      kind: scene.kind,
      title: scene.title,
      body: scene.body,
      transcript: scene.transcript,
      video: video
        ? {
            url: await this.storage.signDownload(video.storageKey),
            contentType: video.contentType,
            captionsUrl: captions ? await this.storage.signDownload(captions.storageKey) : null,
            posterUrl: poster ? await this.storage.signDownload(poster.storageKey) : null,
          }
        : null,
      gaps: sceneGaps(scene),
    };
  }

  /** Forgets an upload that did not check out, and its file. */
  private async discard(asset: { id: string; storageKey: string }): Promise<void> {
    await this.removeQuietly(asset.storageKey);
    await this.prisma.mediaAsset.delete({ where: { id: asset.id } });
  }

  /**
   * Deletes a file no record points at any more. A failure is logged, not
   * thrown: the change it follows has already happened, and a stray file in
   * storage costs pennies where a failed request would confuse.
   */
  private async removeQuietly(storageKey: string): Promise<void> {
    try {
      await this.storage.remove(storageKey);
    } catch (error) {
      this.logger.warn(`Could not delete ${storageKey} from storage: ${String(error)}`);
    }
  }
}

const fileSelect = {
  id: true,
  storageKey: true,
  fileName: true,
  contentType: true,
  sizeBytes: true,
  readyAt: true,
  createdAt: true,
} as const;

const sceneSelect = {
  id: true,
  lessonId: true,
  kind: true,
  sequence: true,
  title: true,
  body: true,
  transcript: true,
  videoAssetId: true,
  captionsAssetId: true,
  posterAssetId: true,
  video: { select: fileSelect },
  captions: { select: fileSelect },
  poster: { select: fileSelect },
  lesson: {
    select: {
      id: true,
      title: true,
      status: true,
      module: {
        select: {
          id: true,
          title: true,
          pathway: { select: { id: true, slug: true, title: true } },
        },
      },
    },
  },
} as const;

const previewSelect = {
  id: true,
  title: true,
  summary: true,
  kind: true,
  status: true,
  archivedAt: true,
  module: {
    select: {
      id: true,
      title: true,
      pathway: { select: { id: true, slug: true, title: true } },
    },
  },
  // Every scene, in the order learners get them.
  scenes: {
    orderBy: { sequence: "asc" },
    select: {
      id: true,
      kind: true,
      title: true,
      body: true,
      transcript: true,
      videoAssetId: true,
      captionsAssetId: true,
      posterAssetId: true,
      video: { select: { storageKey: true, contentType: true } },
      captions: { select: { storageKey: true } },
      poster: { select: { storageKey: true } },
    },
  },
} as const;

type SceneRow = Prisma.LessonSceneGetPayload<{ select: typeof sceneSelect }>;
type FileRow = Prisma.MediaAssetGetPayload<{ select: typeof fileSelect }>;
type PreviewSceneRow = Prisma.LessonGetPayload<{ select: typeof previewSelect }>["scenes"][number];

/** A lesson with any video scene is a video lesson; otherwise a text one. */
async function syncLessonKind(tx: Prisma.TransactionClient, lessonId: string): Promise<void> {
  const [lesson, videos] = await Promise.all([
    tx.lesson.findUnique({ where: { id: lessonId }, select: { kind: true } }),
    tx.lessonScene.count({ where: { lessonId, kind: "VIDEO" } }),
  ]);
  const kind = videos > 0 ? "VIDEO" : "TEXT";

  if (lesson && lesson.kind !== kind) {
    await tx.lesson.update({ where: { id: lessonId }, data: { kind } });
  }
}

/** "1 GB", "5 MB", "300 KB": sizes as the content team thinks of them. */
function sizeOf(bytes: number): string {
  const units = [
    ["GB", 1024 ** 3],
    ["MB", 1024 ** 2],
    ["KB", 1024],
  ] as const;

  for (const [unit, size] of units) {
    if (bytes >= size) {
      return `${Math.round((bytes / size) * 10) / 10} ${unit}`;
    }
  }

  return `${bytes} bytes`;
}
