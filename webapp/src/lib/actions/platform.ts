"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { institutionContent } from "@/content/institution";
import { platformContent } from "@/content/platform";
import { apiRequest } from "../api/client";
import type {
  Institution,
  IssuedContentTeamInvite,
  IssuedInvite,
  RemovedContentManager,
} from "../api/contracts";
import { assertPlatformAdministrator } from "../api/platform";
import { keepValues, missingValues, text, toFormState, type FormState } from "./form-state";

/*
  What a platform administrator does: add an institution, and invite the
  person who will run it. Everything after that — inviting learners, opening
  intakes — is the institution's own administrator's job, on /institution.

  Unlike the /institution actions, the institution here comes from the form:
  choosing among every institution is the point of the role. It grants nothing
  extra — the API confirms the platform role against the database on each call.

  `redirect()` works by throwing, so it is always called outside the try/catch.
*/

const OPTIONAL_FIELDS = ["contactPhone", "website", "addressLine", "city", "country"] as const;

export async function createInstitution(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = text(formData, "name");
  const type = text(formData, "type");
  const contactEmail = text(formData, "contactEmail");
  const missing = missingValues({ name, type, contactEmail });
  const keep = (state: FormState) =>
    keepValues(state, formData, ["name", "type", "contactEmail", ...OPTIONAL_FIELDS]);

  if (missing) {
    return keep(missing);
  }

  await assertPlatformAdministrator();

  // Optional fields go as absent rather than empty: the API validates what it
  // is sent, and "" is not a phone number or a URL.
  const optional = Object.fromEntries(
    OPTIONAL_FIELDS.map((field) => [field, text(formData, field)]).filter(([, value]) => value),
  );

  let institution: Institution;

  try {
    institution = await apiRequest<Institution>("/api/institutions", {
      method: "POST",
      body: { name, type, contactEmail, ...optional },
    });
  } catch (error) {
    return keep(toFormState(error, ["name", "type", "contactEmail", ...OPTIONAL_FIELDS]));
  }

  revalidatePath("/platform/institutions");
  // Straight to it: inviting its administrator is the next thing to do.
  redirect(`/platform/institutions/${institution.id}`);
}

/** Invites the person who will run an institution, as its administrator. */
export async function inviteAdministrator(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const institutionId = text(formData, "institutionId");
  const email = text(formData, "email");
  const missing = missingValues({ email });
  const keep = (state: FormState) => keepValues(state, formData, ["email"]);

  if (missing) {
    return keep(missing);
  }

  await assertPlatformAdministrator();

  try {
    const invite = await apiRequest<IssuedInvite>(`/api/institutions/${institutionId}/invites`, {
      method: "POST",
      body: { email, role: "INSTITUTION_ADMIN" },
    });

    revalidatePath(`/platform/institutions/${institutionId}`);

    return invite.emailStatus === "FAILED"
      ? {
          status: "error",
          message: `The invitation to ${invite.email} was created, but the email did not send. Resend it below.`,
        }
      : { status: "success", message: `Invitation sent to ${invite.email}.` };
  } catch (error) {
    return keep(toFormState(error, ["email"]));
  }
}

export async function resendInstitutionInvite(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return inviteCommand(formData, "resend", "Sent again.");
}

export async function revokeInstitutionInvite(
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
  const institutionId = encodeURIComponent(text(formData, "institutionId"));
  const inviteId = encodeURIComponent(text(formData, "inviteId"));

  await assertPlatformAdministrator();

  try {
    await apiRequest(`/api/institutions/${institutionId}/invites/${inviteId}/${command}`, {
      method: "POST",
    });
    revalidatePath(`/platform/institutions/${institutionId}`);

    return { status: "success", message: done };
  } catch (error) {
    return toFormState(error, []);
  }
}

/** Invites someone onto the content team, as a content manager. */
export async function inviteContentManager(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData, "email");
  const missing = missingValues({ email });
  const keep = (state: FormState) => keepValues(state, formData, ["email"]);

  if (missing) {
    return keep(missing);
  }

  await assertPlatformAdministrator();

  const copy = platformContent.contentTeam.invite;

  try {
    const invite = await apiRequest<IssuedContentTeamInvite>("/api/content-team/invites", {
      method: "POST",
      body: { email },
    });

    revalidatePath("/platform/content-team");

    return invite.emailStatus === "FAILED"
      ? { status: "error", message: copy.emailFailed(invite.email) }
      : { status: "success", message: copy.sent(invite.email) };
  } catch (error) {
    return keep(toFormState(error, ["email"]));
  }
}

export async function resendContentTeamInvite(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return contentTeamInviteCommand(formData, "resend", platformContent.contentTeam.pending.resent);
}

export async function revokeContentTeamInvite(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return contentTeamInviteCommand(
    formData,
    "revoke",
    // The email is only for the message; the id decides which invitation.
    institutionContent.members.pending.revoked(text(formData, "email")),
  );
}

async function contentTeamInviteCommand(
  formData: FormData,
  command: "resend" | "revoke",
  done: string,
): Promise<FormState> {
  const inviteId = encodeURIComponent(text(formData, "inviteId"));

  await assertPlatformAdministrator();

  try {
    await apiRequest(`/api/content-team/invites/${inviteId}/${command}`, { method: "POST" });
    revalidatePath("/platform/content-team");

    return { status: "success", message: done };
  } catch (error) {
    return toFormState(error, []);
  }
}

/**
 * Takes a content manager off the content team. Their account stays, and the
 * API checks the role against the database, so the content screens close to
 * them at once.
 */
export async function removeContentManager(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = encodeURIComponent(text(formData, "userId"));
  // The name is only for the message; the id decides who.
  const name = text(formData, "name");

  await assertPlatformAdministrator();

  try {
    await apiRequest<RemovedContentManager>(`/api/content-team/members/${userId}/remove`, {
      method: "POST",
    });
    revalidatePath("/platform/content-team");

    return { status: "success", message: platformContent.contentTeam.members.remove.done(name) };
  } catch (error) {
    return toFormState(error, []);
  }
}
