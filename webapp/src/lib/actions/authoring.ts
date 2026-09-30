"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authoringContent } from "@/content/authoring";
import { apiRequest } from "../api/client";
import type {
  AuthoringLessonSummary,
  AuthoringModuleSummary,
  AuthoringScene,
  MediaPurpose,
  UploadTicket,
} from "../api/contracts";
import { userMessage } from "../api/errors";
import { keepValues, missingValues, text, toFormState, type FormState } from "./form-state";

/*
  What the content team does to the Academy.

  Every change refreshes the whole app's router cache, not just these screens:
  the author may have the learner's Academy open too, and publishing or editing
  changes what it shows.

  Ids from hidden fields go into the API's path encoded. A title posted beside
  one is only for the message; which item changes is decided by the id.

  `redirect()` works by throwing, so it is always called outside the try/catch.
*/

const copy = authoringContent;
const DETAILS = ["title", "summary"] as const;

// ─── Modules ────────────────────────────────────────────────────────────────

/** Adds a module, then opens it so its lessons can be added straight away. */
export async function createModule(_previous: FormState, formData: FormData): Promise<FormState> {
  const pathwayId = id(formData, "pathwayId");
  const title = text(formData, "title");
  const keep = (state: FormState) => keepValues(state, formData, DETAILS);
  const missing = missingValues({ title });

  if (missing) {
    return keep(missing);
  }

  let created: AuthoringModuleSummary;

  try {
    created = await apiRequest<AuthoringModuleSummary>(`/api/authoring/pathways/${pathwayId}/modules`, {
      method: "POST",
      body: { title, summary: text(formData, "summary") || undefined },
    });
  } catch (error) {
    return keep(toFormState(error, [...DETAILS]));
  }

  revalidatePath("/", "layout");
  redirect(`/content/academy/modules/${created.id}`);
}

export async function updateModule(_previous: FormState, formData: FormData): Promise<FormState> {
  return updateDetails(formData, `/api/authoring/modules/${id(formData, "moduleId")}`);
}

export async function moveModule(_previous: FormState, formData: FormData): Promise<FormState> {
  return move(formData, `/api/authoring/modules/${id(formData, "moduleId")}/move`);
}

export async function publishModule(_previous: FormState, formData: FormData): Promise<FormState> {
  return command(`/api/authoring/modules/${id(formData, "moduleId")}/publish`, copy.publishing.published(text(formData, "title")));
}

export async function unpublishModule(_previous: FormState, formData: FormData): Promise<FormState> {
  return command(`/api/authoring/modules/${id(formData, "moduleId")}/unpublish`, copy.publishing.unpublished(text(formData, "title")));
}

export async function archiveModule(_previous: FormState, formData: FormData): Promise<FormState> {
  return command(`/api/authoring/modules/${id(formData, "moduleId")}/archive`, copy.archive.done(text(formData, "title")));
}

export async function restoreModule(_previous: FormState, formData: FormData): Promise<FormState> {
  return command(`/api/authoring/modules/${id(formData, "moduleId")}/restore`, copy.archive.restored(text(formData, "title")));
}

// ─── Lessons ────────────────────────────────────────────────────────────────

/** Adds a lesson, then opens it so its scenes can be added straight away. */
export async function createLesson(_previous: FormState, formData: FormData): Promise<FormState> {
  const moduleId = id(formData, "moduleId");
  const title = text(formData, "title");
  const keep = (state: FormState) => keepValues(state, formData, DETAILS);
  const missing = missingValues({ title });

  if (missing) {
    return keep(missing);
  }

  let created: AuthoringLessonSummary;

  try {
    created = await apiRequest<AuthoringLessonSummary>(`/api/authoring/modules/${moduleId}/lessons`, {
      method: "POST",
      body: { title, summary: text(formData, "summary") || undefined },
    });
  } catch (error) {
    return keep(toFormState(error, [...DETAILS]));
  }

  revalidatePath("/", "layout");
  redirect(`/content/academy/lessons/${created.id}`);
}

export async function updateLesson(_previous: FormState, formData: FormData): Promise<FormState> {
  return updateDetails(formData, `/api/authoring/lessons/${id(formData, "lessonId")}`);
}

export async function moveLesson(_previous: FormState, formData: FormData): Promise<FormState> {
  return move(formData, `/api/authoring/lessons/${id(formData, "lessonId")}/move`);
}

export async function publishLesson(_previous: FormState, formData: FormData): Promise<FormState> {
  return command(`/api/authoring/lessons/${id(formData, "lessonId")}/publish`, copy.publishing.published(text(formData, "title")));
}

export async function unpublishLesson(_previous: FormState, formData: FormData): Promise<FormState> {
  return command(`/api/authoring/lessons/${id(formData, "lessonId")}/unpublish`, copy.publishing.unpublished(text(formData, "title")));
}

export async function archiveLesson(_previous: FormState, formData: FormData): Promise<FormState> {
  return command(`/api/authoring/lessons/${id(formData, "lessonId")}/archive`, copy.archive.done(text(formData, "title")));
}

export async function restoreLesson(_previous: FormState, formData: FormData): Promise<FormState> {
  return command(`/api/authoring/lessons/${id(formData, "lessonId")}/restore`, copy.archive.restored(text(formData, "title")));
}

// ─── Scenes ─────────────────────────────────────────────────────────────────

/** Adds a scene, then opens it so its files or notes can be added. */
export async function createScene(_previous: FormState, formData: FormData): Promise<FormState> {
  const lessonId = id(formData, "lessonId");
  const kind = text(formData, "kind");
  const title = text(formData, "title");
  const keep = (state: FormState) => keepValues(state, formData, ["kind", "title"]);
  const missing = missingValues({ kind, title });

  if (missing) {
    return keep(missing);
  }

  let created: AuthoringScene;

  try {
    created = await apiRequest<AuthoringScene>(`/api/authoring/lessons/${lessonId}/scenes`, {
      method: "POST",
      body: { kind, title },
    });
  } catch (error) {
    return keep(toFormState(error, ["kind", "title"]));
  }

  revalidatePath("/", "layout");
  redirect(`/content/academy/scenes/${created.id}`);
}

export async function moveScene(_previous: FormState, formData: FormData): Promise<FormState> {
  return move(formData, `/api/authoring/scenes/${id(formData, "sceneId")}/move`);
}

export async function removeScene(_previous: FormState, formData: FormData): Promise<FormState> {
  return command(`/api/authoring/scenes/${id(formData, "sceneId")}`, copy.lesson.remove.done(text(formData, "title")), "DELETE");
}

/** Saves a scene's title and text — a notes scene's notes, a video's lines. */
export async function updateScene(_previous: FormState, formData: FormData): Promise<FormState> {
  const sceneId = id(formData, "sceneId");
  const title = text(formData, "title");
  const keep = (state: FormState) => keepValues(state, formData, ["title"]);
  const missing = missingValues({ title });

  if (missing) {
    return keep(missing);
  }

  try {
    await apiRequest(`/api/authoring/scenes/${sceneId}`, {
      method: "PATCH",
      // Kept as typed — its blank lines are its paragraphs — and cleared when empty.
      body: { title, body: String(formData.get("body") ?? "").trim() || null },
    });
  } catch (error) {
    return keep(toFormState(error, ["title", "body"]));
  }

  revalidatePath("/", "layout");

  return { status: "success", message: copy.details.saved };
}

/** Either where to send the file, or why it cannot be sent. */
export type UploadStart = { ticket: UploadTicket } | { error: string };

/**
 * Asks the API for a link to upload one file to. The file itself never comes
 * through here: the browser sends it straight to storage with the link.
 */
export async function requestUpload(input: {
  sceneId: string;
  purpose: MediaPurpose;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<UploadStart> {
  try {
    const ticket = await apiRequest<UploadTicket>(
      `/api/authoring/scenes/${encodeURIComponent(input.sceneId)}/uploads`,
      {
        method: "POST",
        body: {
          purpose: input.purpose,
          fileName: input.fileName,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
        },
      },
    );

    return { ticket };
  } catch (error) {
    return { error: userMessage(error) };
  }
}

/** Once the file is in storage: the API checks it, then attaches it. */
export async function completeUpload(assetId: string, fileName: string): Promise<FormState> {
  return command(
    `/api/authoring/uploads/${encodeURIComponent(assetId)}/complete`,
    copy.scene.uploaded(fileName),
  );
}

// ─── Shared ─────────────────────────────────────────────────────────────────

/** Saves a title and summary; an emptied summary is cleared. */
async function updateDetails(formData: FormData, path: string): Promise<FormState> {
  const title = text(formData, "title");
  const keep = (state: FormState) => keepValues(state, formData, DETAILS);
  const missing = missingValues({ title });

  if (missing) {
    return keep(missing);
  }

  try {
    await apiRequest(path, {
      method: "PATCH",
      body: { title, summary: text(formData, "summary") || null },
    });
  } catch (error) {
    return keep(toFormState(error, [...DETAILS]));
  }

  revalidatePath("/", "layout");

  return { status: "success", message: copy.details.saved };
}

async function move(formData: FormData, path: string): Promise<FormState> {
  const direction = text(formData, "direction") === "UP" ? "UP" : "DOWN";

  return command(path, direction === "UP" ? copy.move.movedUp : copy.move.movedDown, "POST", {
    direction,
  });
}

async function command(
  path: string,
  message: string,
  method: "POST" | "DELETE" = "POST",
  body?: object,
): Promise<FormState> {
  try {
    await apiRequest(path, { method, body });
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath("/", "layout");

  return { status: "success", message };
}

/** An id from a hidden field, ready for a path: encoded, so it stays one segment. */
function id(formData: FormData, name: string): string {
  return encodeURIComponent(text(formData, name));
}
