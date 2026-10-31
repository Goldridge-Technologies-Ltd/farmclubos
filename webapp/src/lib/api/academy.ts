import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { apiRequest } from "./client";
import type {
  Assessment,
  Attempt,
  Enrolment,
  Journey,
  LessonDetail,
  LessonStanding,
  ModuleDetail,
  PathwayDetail,
  PathwaySummary,
} from "./contracts";
import { isMissingRecord, isNotFound } from "./errors";

/*
  The Academy reads, in one place.

  Each one turns the API's 404 into Next's `notFound()`, so a slug that does
  not exist — or is not published — renders not-found.tsx rather than the
  error boundary. Everything else is left to throw: the API being down is not
  the same as a page not existing, and must not look like it.

  None of these are cached. The catalogue is identical for everyone, so
  caching it would be safe in principle, but the client refuses to cache any
  reply that carried a bearer token, and an exception to that rule is how one
  person's data eventually reaches another.

  The reads a page also makes for its title are memoised for the request
  with React's `cache`, which is not that: it only spares the second call.
  `fetch` would spare it itself, but the client gives every request its own id.
*/

export async function listPathways(): Promise<PathwaySummary[]> {
  return apiRequest<PathwaySummary[]>("/api/academy/pathways");
}

export const getPathway = cache(
  async (pathwaySlug: string): Promise<PathwayDetail> =>
    orNotFound(apiRequest<PathwayDetail>(`/api/academy/pathways/${encode(pathwaySlug)}`)),
);

export const getModule = cache(
  async (pathwaySlug: string, moduleSlug: string): Promise<ModuleDetail> =>
    orNotFound(
      apiRequest<ModuleDetail>(
        `/api/academy/pathways/${encode(pathwaySlug)}/modules/${encode(moduleSlug)}`,
      ),
    ),
);

export const getLesson = cache(
  async (pathwaySlug: string, moduleSlug: string, lessonSlug: string): Promise<LessonDetail> =>
    orNotFound(
      apiRequest<LessonDetail>(
        `/api/academy/pathways/${encode(pathwaySlug)}/modules/${encode(moduleSlug)}` +
          `/lessons/${encode(lessonSlug)}`,
      ),
    ),
);

/** The caller's own enrolments, in their active institution. */
export async function listMyEnrolments(): Promise<Enrolment[]> {
  return apiRequest<Enrolment[]>("/api/enrolments/mine");
}

async function orNotFound<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (isNotFound(error)) {
      notFound();
    }

    throw error;
  }
}

/** A slug comes from the URL, so it goes back into one encoded. */
function encode(slug: string): string {
  return encodeURIComponent(slug);
}

/* ── Progress and assessments ─────────────────────────────────────────── */

export async function myJourney(): Promise<Journey[]> {
  return apiRequest<Journey[]>("/api/progress/mine");
}

/** Whether the caller is enrolled for this lesson, and the scenes they have finished. */
export async function getLessonStanding(lessonId: string): Promise<LessonStanding> {
  return apiRequest<LessonStanding>(`/api/progress/lessons/${encode(lessonId)}`);
}

export const getAssessment = cache(
  async (assessmentId: string): Promise<Assessment> =>
    orMissing(apiRequest<Assessment>(`/api/assessments/${encode(assessmentId)}`)),
);

export const getAttempt = cache(
  async (attemptId: string): Promise<Attempt> =>
    orMissing(apiRequest<Attempt>(`/api/assessments/attempts/${encode(attemptId)}`)),
);

/** For reads by an id from the URL, where a malformed id is also not-found. */
async function orMissing<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (isMissingRecord(error)) {
      notFound();
    }

    throw error;
  }
}
