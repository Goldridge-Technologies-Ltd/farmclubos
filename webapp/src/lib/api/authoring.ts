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
} from "./contracts";
import { isMissingRecord } from "./errors";

/*
  The reads behind the content team's screens.

  Items are addressed by id rather than slug: a draft's slug follows its title,
  and an id never moves. A malformed or unknown id is not-found, as for any
  record read by an id from the URL.
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
  return apiRequest<AuthoringPathwaySummary[]>("/api/authoring/pathways");
}

export async function getAuthoringPathway(pathwayId: string): Promise<AuthoringPathway> {
  return byId(apiRequest<AuthoringPathway>(`/api/authoring/pathways/${encode(pathwayId)}`));
}

export async function getAuthoringModule(moduleId: string): Promise<AuthoringModule> {
  return byId(apiRequest<AuthoringModule>(`/api/authoring/modules/${encode(moduleId)}`));
}

export async function getAuthoringLesson(lessonId: string): Promise<AuthoringLesson> {
  return byId(apiRequest<AuthoringLesson>(`/api/authoring/lessons/${encode(lessonId)}`));
}

export async function getAuthoringScene(sceneId: string): Promise<AuthoringScene> {
  return byId(apiRequest<AuthoringScene>(`/api/authoring/scenes/${encode(sceneId)}`));
}

async function byId<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
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
