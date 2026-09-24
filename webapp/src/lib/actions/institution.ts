"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRequest } from "../api/client";
import type { CohortSummary, IssuedInvite } from "../api/contracts";
import { managedInstitution } from "../api/institution";
import { keepValues, missingValues, text, toFormState, type FormState } from "./form-state";

/*
  What an institution administrator does: invite people, open intakes, and
  enrol members onto them.

  The institution always comes from the session, never from the form. A hidden
  field could be edited to name another institution; the API would refuse it,
  but there is no reason to offer the chance.

  `redirect()` works by throwing, so it is always called outside the try/catch
  around the API call.
*/

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
  return inviteCommand(formData, "revoke", "Revoked. The link no longer works.");
}

async function inviteCommand(
  formData: FormData,
  command: "resend" | "revoke",
  done: string,
): Promise<FormState> {
  const inviteId = text(formData, "inviteId");
  const institution = await managedInstitution();

  try {
    await apiRequest(`/api/institutions/${institution.id}/invites/${inviteId}/${command}`, {
      method: "POST",
    });
    revalidatePath("/institution/members");

    return { status: "success", message: done };
  } catch (error) {
    return toFormState(error, []);
  }
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
    return keep(toFormState(error, ["pathwaySlug", "name", "code", "startsOn", "endsOn"]));
  }

  revalidatePath("/institution/cohorts");
  redirect(`/institution/cohorts/${cohort.id}`);
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
    await apiRequest(`/api/institutions/${institution.id}/cohorts/${cohortId}/enrolments`, {
      method: "POST",
      body: { email },
    });

    revalidatePath(`/institution/cohorts/${cohortId}`);
    revalidatePath("/institution/cohorts");

    return { status: "success", message: `${email} is enrolled.` };
  } catch (error) {
    return keep(toFormState(error, ["email"]));
  }
}
