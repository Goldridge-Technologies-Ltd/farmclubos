import "server-only";

import { notFound } from "next/navigation";
import { canAuthorContent } from "../navigation";
import { getSessionContext } from "../session";
import { apiRequest } from "./client";
import type {
  AuthoringLesson,
  AuthoringModule,
  AuthoringPathway,
  AuthoringPathwaySummary,
  AuthoringScene,
  LessonPreview,
} from "./contracts";
import { isMissingRecord } from "./errors";

/*
  The reads behind the content team's screens.

  Items are addressed by id rather than slug: a draft's slug follows its title,
  and an id never moves. A malformed or unknown id is not-found, as for any
  record read by an id from the URL.

  Each read checks the role itself, not only the section's layout: a page
  renders alongside its layout, so its request would otherwise still reach
  the API, and fail there, for someone the layout is already turning away.
*/

/**
 * Not-found for anyone off the content team — the same answer the API gives
 * them — rather than screens that fail one request at a time.
 */
export async function assertContentTeam(): Promise<void> {
  const session = await getSessionContext();

  if (!session || !canAuthorContent(session)) {
    notFound();
  }
}

export async function listAuthoringPathways(): Promise<AuthoringPathwaySummary[]> {
  await assertContentTeam();

  return apiRequest<AuthoringPathwaySummary[]>("/api/authoring/pathways");
}

export async function getAuthoringPathway(pathwayId: string): Promise<AuthoringPathway> {
  return byId<AuthoringPathway>(`/api/authoring/pathways/${encode(pathwayId)}`);
}

export async function getAuthoringModule(moduleId: string): Promise<AuthoringModule> {
  return byId<AuthoringModule>(`/api/authoring/modules/${encode(moduleId)}`);
}

export async function getAuthoringLesson(lessonId: string): Promise<AuthoringLesson> {
  return byId<AuthoringLesson>(`/api/authoring/lessons/${encode(lessonId)}`);
}

export async function getAuthoringScene(sceneId: string): Promise<AuthoringScene> {
  return byId<AuthoringScene>(`/api/authoring/scenes/${encode(sceneId)}`);
}

export async function getLessonPreview(lessonId: string): Promise<LessonPreview> {
  return byId<LessonPreview>(`/api/authoring/lessons/${encode(lessonId)}/preview`);
}

async function byId<T>(path: string): Promise<T> {
  await assertContentTeam();

  try {
    return await apiRequest<T>(path);
  } catch (error) {
    if (isMissingRecord(error)) {
      notFound();
    }

    throw error;
  }
}

function encode(id: string): string {
  return encodeURIComponent(id);
}
