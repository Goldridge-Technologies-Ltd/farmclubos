import type { Journey } from "./api/contracts";
import { isCohortClosed } from "./cohorts";

export type NextLesson = { href: string; title: string; moduleTitle: string };

/**
 * The first lesson not yet completed, in the order the pathway is meant to be
 * taken. Null when there is nothing left — or nothing published — to do.
 */
export function nextLesson(journey: Journey): NextLesson | null {
  const modules = [...journey.modules].sort((a, b) => a.sequence - b.sequence);

  for (const pathwayModule of modules) {
    const lesson = pathwayModule.lessons.find((entry) => entry.status !== "COMPLETED");

    if (lesson) {
      return {
        href: `/academy/${journey.pathway.slug}/modules/${pathwayModule.slug}/lessons/${lesson.slug}`,
        title: lesson.title,
        moduleTitle: pathwayModule.title,
      };
    }
  }

  return null;
}

/**
 * On an intake that has since closed, with the pathway not yet finished. A
 * close stops new enrolments, not the learners already on it, so they are
 * told they can carry on rather than left to guess.
 */
export function finishingAfterClose(journey: Journey): boolean {
  return isCohortClosed(journey.cohort.status) && journey.status !== "COMPLETED";
}
