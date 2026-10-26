"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRequest } from "../api/client";
import type { Attempt, LessonCompletion, SceneCompletion, StartedPathway } from "../api/contracts";
import { replaceAccessToken } from "../session";
import { safeRedirectPath } from "../session-cookies";
import { text, toFormState, type FormState } from "./form-state";

/*
  The mutations the Academy screens make.

  Each one is a Server Action posting to the API, because each needs the
  access token in an httpOnly cookie that browser JavaScript cannot read.

  `redirect()` works by throwing, so it is always called outside the try/catch
  around the API call — inside, the catch would swallow it.

  A file marked "use server" may export only async functions; the shared types
  live in ./form-state.
*/

/**
 * Starts a pathway on one's own, then goes on to `next`. Anyone may: it makes
 * them an independent learner, and the API moves the session there if it was
 * elsewhere, since that is where their progress is recorded. Every screen
 * reads the session's institution, so none of them may be reused.
 */
export async function startPathway(_previous: FormState, formData: FormData): Promise<FormState> {
  const pathwaySlug = text(formData, "pathwaySlug");
  const next = safeRedirectPath(text(formData, "next"));

  try {
    const started = await apiRequest<StartedPathway>(
      `/api/academy/pathways/${encodeURIComponent(pathwaySlug)}/start`,
      { method: "POST" },
    );

    if (started.session) {
      await replaceAccessToken(started.session.accessToken, started.session.accessTokenExpiresAt);
    }
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

/** Records a lesson as done and refreshes what the screens show. */
export async function completeLesson(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const lessonId = String(formData.get("lessonId") ?? "");

  try {
    const completion = await apiRequest<LessonCompletion>("/api/progress/lessons/complete", {
      method: "POST",
      body: { lessonId },
    });

    /*
      The lesson page, the module list and the journey all show this. They are
      per-user reads and so uncached, but the router keeps its own client-side
      cache of the segments already visited; without this, going back to the
      module would still show the lesson as outstanding.
    */
    revalidatePath("/academy", "layout");
    revalidatePath("/my-journey");

    return {
      status: "success",
      message: `Marked complete. You are ${completion.progressPercent}% through this pathway.`,
    };
  } catch (error) {
    return toFormState(error, []);
  }
}

/**
 * Records the scene as finished, then moves on: to the next scene, or — after
 * the last — to the lesson's completed state. The API completes the lesson
 * itself once every scene is done.
 */
export async function completeScene(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const sceneId = text(formData, "sceneId");
  // Guarded like any redirect target taken from a form.
  const next = safeRedirectPath(text(formData, "next"), "/my-journey");

  try {
    await apiRequest<SceneCompletion>("/api/progress/scenes/complete", {
      method: "POST",
      body: { sceneId },
    });
  } catch (error) {
    return toFormState(error, []);
  }

  // The lesson, its module, the journey and home all show this progress.
  revalidatePath("/", "layout");
  redirect(next);
}

/**
 * Starts or resumes an attempt, then sends the learner to it.
 *
 * Resuming is the API's job: a second press must not use up another attempt
 * or lose answers already saved.
 */
export async function startAttempt(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/academy");
  let attempt: Attempt;

  try {
    attempt = await apiRequest<Attempt>(`/api/assessments/${assessmentId}/attempts`, {
      method: "POST",
    });
  } catch (error) {
    return toFormState(error, []);
  }

  redirect(`${returnTo}/assessments/${assessmentId}/attempts/${attempt.id}`);
}

/** Saves the answers given so far, without submitting. */
export async function saveAnswers(
  attemptId: string,
  answers: { questionId: string; selectedOptionIds?: string[]; textAnswer?: string | null }[],
): Promise<FormState> {
  try {
    await apiRequest<Attempt>(`/api/assessments/attempts/${attemptId}`, {
      method: "PATCH",
      body: { answers },
    });

    return { status: "success", message: "Answers saved." };
  } catch (error) {
    return toFormState(error, []);
  }
}

/** Saves whatever is on the form, then submits it for grading. */
export async function submitAttempt(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const attemptId = String(formData.get("attemptId") ?? "");
  // Guarded like any redirect target taken from a form: a crafted value must
  // not send someone off the site.
  const returnTo = safeRedirectPath(text(formData, "returnTo"), "/my-journey");
  const answers = readAnswers(formData);

  try {
    if (answers.length > 0) {
      await apiRequest(`/api/assessments/attempts/${attemptId}`, {
        method: "PATCH",
        body: { answers },
      });
    }

    await apiRequest<Attempt>(`/api/assessments/attempts/${attemptId}/submit`, {
      method: "POST",
    });

    revalidatePath("/academy", "layout");
    revalidatePath("/my-journey");
  } catch (error) {
    return toFormState(error, []);
  }

  /*
    Back to the same attempt, which now renders its result. The marker tells
    the page this is the moment of submitting, so it moves focus to the score
    rather than leaving the learner wherever the submit button was.
  */
  redirect(`${returnTo}?submitted=1`);
}

/**
 * The form's fields, back into the shape the API takes.
 *
 * Choices arrive as `option:<questionId>` (one entry per box ticked) and
 * written answers as `text:<questionId>`. A question with neither is simply
 * not sent, rather than sent empty — an unanswered question and one answered
 * with nothing are the same thing, and the API treats a missing response as
 * unanswered already.
 */
function readAnswers(formData: FormData) {
  const answers = new Map<
    string,
    { questionId: string; selectedOptionIds: string[]; textAnswer?: string | null }
  >();

  for (const [field, value] of formData.entries()) {
    const [kind, questionId] = field.split(":");

    if (!questionId || (kind !== "option" && kind !== "text")) {
      continue;
    }

    const answer = answers.get(questionId) ?? { questionId, selectedOptionIds: [] };

    if (kind === "option") {
      answer.selectedOptionIds.push(String(value));
    } else {
      const text = String(value).trim();

      if (!text) {
        continue;
      }

      answer.textAnswer = text;
    }

    answers.set(questionId, answer);
  }

  return [...answers.values()];
}
