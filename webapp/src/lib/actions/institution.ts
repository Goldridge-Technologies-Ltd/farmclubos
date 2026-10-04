"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRequest } from "../api/client";
import { institutionContent } from "@/content/institution";
import type { CohortSummary, IssuedInvite, RemovedMember } from "../api/contracts";
import { managedInstitution } from "../api/institution";
import { getSessionContext } from "../session";
import { keepValues, missingValues, text, toFormState, type FormState } from "./form-state";

/*
  What an institution administrator does: invite people, open intakes, and
  enrol members onto them.

  The institution always comes from the session, never from the form. A hidden
  field could be edited to name another institution; the API would refuse it,
  but there is no reason to offer the chance.

  `redirect()` works by throwing, so it is always called outside the try/catch
  around the API call.

  An id posted from a hidden field goes into the API's path encoded: it is
  typed by the browser, and must not be able to become more than one segment.
*/

/** The cohort form's fields, and the refusals that belong under one of them. */
const COHORT_FIELDS = ["pathwaySlug", "name", "code", "startsOn", "endsOn"];
const COHORT_REFUSALS = { CODE_TAKEN: "code", DATES_OUT_OF_ORDER: "endsOn" };

export async function inviteMember(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData, "email");
  const role = text(formData, "role");
  const missing = missingValues({ email, role });
  const keep = (state: FormState) => keepValues(state, formData, ["email", "role"]);

  if (missing) {
    return keep(missing);
  }

  const institution = await managedInstitution();

  try {
    const invite = await apiRequest<IssuedInvite>(
      `/api/institutions/${institution.id}/invites`,
      { method: "POST", body: { email, role } },
    );

    revalidatePath("/institution/members");

    // The invitation exists either way; a failed email only means it has to
    // be sent again, which is a different message from "that went wrong".
    return invite.emailStatus === "FAILED"
      ? {
          status: "error",
          message: `The invitation to ${invite.email} was created, but the email did not send. Resend it below.`,
        }
      : { status: "success", message: `Invitation sent to ${invite.email}.` };
  } catch (error) {
    return keep(toFormState(error, ["email", "role"]));
  }
}

export async function resendInvite(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return inviteCommand(formData, "resend", "Sent again.");
}

export async function revokeInvite(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return inviteCommand(
    formData,
    "revoke",
    // The email is only for the message; the id decides which invitation.
    institutionContent.members.pending.revoked(text(formData, "email")),
  );
}

async function inviteCommand(
  formData: FormData,
  command: "resend" | "revoke",
  done: string,
): Promise<FormState> {
  const inviteId = encodeURIComponent(text(formData, "inviteId"));
  const institution = await managedInstitution();

  try {
    // A resend says whether its email went; a revoke has no email to report.
    const invite = await apiRequest<{ email: string; emailStatus?: IssuedInvite["emailStatus"] }>(
      `/api/institutions/${institution.id}/invites/${inviteId}/${command}`,
      { method: "POST" },
    );
    revalidatePath("/institution/members");

    // The invitation has a fresh link either way; only its email failed.
    return invite.emailStatus === "FAILED"
      ? { status: "error", message: institutionContent.members.pending.notSent(invite.email) }
      : { status: "success", message: done };
  } catch (error) {
    return toFormState(error, []);
  }
}

/**
 * Takes someone out of the institution. The API withdraws their open cohort
 * places in the same step, so every screen under /institution is refreshed.
 *
 * Someone who removes themselves can no longer see these screens, so they go
 * home rather than to a page that now answers not-found.
 */
export async function removeMember(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = text(formData, "userId");
  // Only for the message: who they are is decided by the id.
  const name = text(formData, "name");
  const [institution, session] = await Promise.all([managedInstitution(), getSessionContext()]);
  let removed: RemovedMember;

  try {
    removed = await apiRequest<RemovedMember>(
      `/api/institutions/${institution.id}/members/${encodeURIComponent(userId)}/remove`,
      { method: "POST" },
    );
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath("/institution", "layout");

  if (session?.user.id === userId) {
    redirect("/");
  }

  return {
    status: "success",
    message: institutionContent.members.remove.done(
      name,
      institution.name,
      removed.enrolmentsWithdrawn,
    ),
  };
}

/** Opens an intake, then goes to it so learners can be enrolled straight away. */
export async function createCohort(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const pathwaySlug = text(formData, "pathwaySlug");
  const name = text(formData, "name");
  const missing = missingValues({ pathwaySlug, name });
  const keep = (state: FormState) =>
    keepValues(state, formData, ["pathwaySlug", "name", "code", "deliveryMode", "startsOn", "endsOn"]);

  if (missing) {
    return keep(missing);
  }

  const code = text(formData, "code");
  const startsOn = text(formData, "startsOn");
  const endsOn = text(formData, "endsOn");

  if (startsOn && endsOn && endsOn < startsOn) {
    return keep({ status: "error", errors: { endsOn: "The end date is before the start date." } });
  }

  const institution = await managedInstitution();
  let cohort: CohortSummary;

  try {
    cohort = await apiRequest<CohortSummary>(`/api/institutions/${institution.id}/cohorts`, {
      method: "POST",
      body: {
        pathwaySlug,
        name,
        deliveryMode: text(formData, "deliveryMode") || undefined,
        // Optional fields go as absent rather than as empty strings, which
        // the API would reject as malformed.
        ...(code ? { code } : {}),
        ...(startsOn ? { startsOn } : {}),
        ...(endsOn ? { endsOn } : {}),
      },
    });
  } catch (error) {
    return keep(toFormState(error, COHORT_FIELDS, COHORT_REFUSALS));
  }

  revalidatePath("/institution/cohorts");
  redirect(`/institution/cohorts/${cohort.id}`);
}

/**
 * Changes an intake's name, code, delivery or dates, then goes back to it.
 * Never its pathway: the progress of everyone on it belongs to that.
 */
export async function updateCohort(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const cohortId = text(formData, "cohortId");
  const name = text(formData, "name");
  const missing = missingValues({ name });
  const keep = (state: FormState) =>
    keepValues(state, formData, ["name", "code", "deliveryMode", "startsOn", "endsOn"]);

  if (missing) {
    return keep(missing);
  }

  const startsOn = text(formData, "startsOn");
  const endsOn = text(formData, "endsOn");

  if (startsOn && endsOn && endsOn < startsOn) {
    return keep({ status: "error", errors: { endsOn: "The end date is before the start date." } });
  }

  const institution = await managedInstitution();

  try {
    await apiRequest(
      `/api/institutions/${institution.id}/cohorts/${encodeURIComponent(cohortId)}`,
      {
        method: "PATCH",
        body: {
          name,
          deliveryMode: text(formData, "deliveryMode") || undefined,
          // A field emptied on the form is cleared, which the API takes as null.
          code: text(formData, "code") || null,
          startsOn: startsOn || null,
          endsOn: endsOn || null,
        },
      },
    );
  } catch (error) {
    return keep(toFormState(error, COHORT_FIELDS, COHORT_REFUSALS));
  }

  revalidatePath("/institution", "layout");
  redirect(`/institution/cohorts/${encodeURIComponent(cohortId)}`);
}

/** Ends the intake's enrolment. Learners on it keep going. */
export async function closeCohort(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return cohortCommand(formData, "close", institutionContent.cohort.close.done);
}

export async function reopenCohort(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return cohortCommand(formData, "reopen", institutionContent.cohort.closed.done);
}

async function cohortCommand(
  formData: FormData,
  command: "close" | "reopen",
  done: (cohortName: string) => string,
): Promise<FormState> {
  const cohortId = text(formData, "cohortId");
  // Only for the message.
  const cohortName = text(formData, "cohortName");
  const institution = await managedInstitution();

  try {
    await apiRequest(
      `/api/institutions/${institution.id}/cohorts/${encodeURIComponent(cohortId)}/${command}`,
      { method: "POST" },
    );
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath("/institution", "layout");

  return { status: "success", message: done(cohortName) };
}

/** Takes one learner off one intake, keeping their progress for a return. */
export async function withdrawLearner(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const cohortId = encodeURIComponent(text(formData, "cohortId"));
  const enrolmentId = encodeURIComponent(text(formData, "enrolmentId"));
  const name = text(formData, "name");
  const institution = await managedInstitution();

  try {
    await apiRequest(
      `/api/institutions/${institution.id}/cohorts/${cohortId}/enrolments/${enrolmentId}/withdraw`,
      { method: "POST" },
    );
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath("/institution", "layout");

  return { status: "success", message: institutionContent.cohort.withdraw.done(name) };
}

/**
 * Puts a withdrawn learner back on the intake. The API reactivates their old
 * enrolment rather than starting a new one, so their progress carries on.
 */
export async function enrolAgain(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const cohortId = encodeURIComponent(text(formData, "cohortId"));
  const email = text(formData, "email");
  const name = text(formData, "name");
  const institution = await managedInstitution();

  try {
    await apiRequest(`/api/institutions/${institution.id}/cohorts/${cohortId}/enrolments`, {
      method: "POST",
      body: { email },
    });
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath("/institution", "layout");

  return { status: "success", message: institutionContent.cohort.withdrawn.done(name) };
}

export async function enrolMember(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const cohortId = text(formData, "cohortId");
  const email = text(formData, "email");
  const missing = missingValues({ email });
  const keep = (state: FormState) => keepValues(state, formData, ["email"]);

  if (missing) {
    return keep(missing);
  }

  const institution = await managedInstitution();

  try {
    await apiRequest(
      `/api/institutions/${institution.id}/cohorts/${encodeURIComponent(cohortId)}/enrolments`,
      { method: "POST", body: { email } },
    );

    // The cohort, the cohort list's count, and what removing them would withdraw.
    revalidatePath("/institution", "layout");

    return { status: "success", message: `${email} is enrolled.` };
  } catch (error) {
    return keep(toFormState(error, ["email"]));
  }
}
