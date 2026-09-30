import "server-only";

import { notFound } from "next/navigation";
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
*/

export async function listPathways(): Promise<PathwaySummary[]> {
  return apiRequest<PathwaySummary[]>("/api/academy/pathways");
}

export async function getPathway(pathwaySlug: string): Promise<PathwayDetail> {
  return orNotFound(
    apiRequest<PathwayDetail>(`/api/academy/pathways/${encode(pathwaySlug)}`),
  );
}

export async function getModule(
  pathwaySlug: string,
  moduleSlug: string,
): Promise<ModuleDetail> {
  return orNotFound(
    apiRequest<ModuleDetail>(
      `/api/academy/pathways/${encode(pathwaySlug)}/modules/${encode(moduleSlug)}`,
    ),
  );
}

export async function getLesson(
  pathwaySlug: string,
  moduleSlug: string,
  lessonSlug: string,
): Promise<LessonDetail> {
  return orNotFound(
    apiRequest<LessonDetail>(
      `/api/academy/pathways/${encode(pathwaySlug)}/modules/${encode(moduleSlug)}` +
        `/lessons/${encode(lessonSlug)}`,
    ),
  );
}

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

export async function getAssessment(assessmentId: string): Promise<Assessment> {
  return orMissing(apiRequest<Assessment>(`/api/assessments/${encode(assessmentId)}`));
}

export async function getAttempt(attemptId: string): Promise<Attempt> {
  return orMissing(apiRequest<Attempt>(`/api/assessments/attempts/${encode(attemptId)}`));
}

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
