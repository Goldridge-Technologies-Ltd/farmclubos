"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRequest } from "../api/client";
import { forwardedClientAddress } from "../api/forwarded-address";
import type { AuthSession, InviteJoined, SwitchedInstitution } from "../api/contracts";
import { endSession, readRefreshToken, replaceAccessToken, startSession } from "../session";
import { safeRedirectPath } from "../session-cookies";
import { keepValues, missingValues, text, toFormState, type FormState } from "./form-state";

/*
  Every mutation the auth screens make.

  `redirect()` works by throwing, so it is always called *outside* the
  try/catch around the API call — inside, the catch would swallow it and leave
  the person sitting on the form with no idea what happened.

  A file marked "use server" may export only async functions; the shared types
  and helpers live in ./form-state.
*/

export async function signIn(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email");
  const password = text(formData, "password");
  const next = safeRedirectPath(text(formData, "next"));
  const missing = missingValues({ email, password });
  // The email survives a failed attempt; the password never comes back.
  const keep = (state: FormState) => keepValues(state, formData, ["email"]);

  if (missing) {
    return keep(missing);
  }

  try {
    const session = await apiRequest<AuthSession>("/api/auth/login", {
      method: "POST",
      authenticated: false,
      body: { email, password },
      clientAddress: await forwardedClientAddress(),
    });

    await startSession(session);
  } catch (error) {
    return keep(toFormState(error, ["email", "password"]));
  }

  redirect(next);
}

export async function signOut(): Promise<void> {
  const refreshToken = await readRefreshToken();

  if (refreshToken) {
    try {
      // Ends the session family on the API, so the refresh token dies with it
      // rather than staying valid in whatever captured it.
      await apiRequest("/api/auth/logout", {
        method: "POST",
        authenticated: false,
        body: { refreshToken },
      });
    } catch {
      // Being signed out here matters more than the API hearing about it.
    }
  }

  await endSession();
  redirect("/sign-in");
}

/**
 * Moves the session to another institution the person belongs to, then goes
 * home: the page they were on may belong to the institution they just left.
 *
 * Only the access token changes. The API records the choice on the session,
 * so the next refresh stays in it, and the refresh token is left alone.
 */
export async function switchInstitution(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const institutionId = text(formData, "institutionId");

  try {
    const switched = await apiRequest<SwitchedInstitution>("/api/auth/switch-institution", {
      method: "POST",
      body: { institutionId },
    });

    await replaceAccessToken(switched.accessToken, switched.accessTokenExpiresAt);
  } catch (error) {
    return toFormState(error, []);
  }

  // Every screen reads the active institution, so none of them may be reused.
  revalidatePath("/", "layout");
  redirect("/");
}

/** Creates an account from an invitation and signs the new person in. */
export async function acceptInvite(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = text(formData, "token");
  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  const password = text(formData, "password");
  const missing = missingValues({ firstName, lastName, password });
  const keep = (state: FormState) => keepValues(state, formData, ["firstName", "lastName"]);

  if (missing) {
    return keep(missing);
  }

  try {
    const session = await apiRequest<AuthSession>("/api/invites/accept", {
      method: "POST",
      authenticated: false,
      body: { token, firstName, lastName, password },
    });

    await startSession(session);
  } catch (error) {
    return keep(toFormState(error, ["firstName", "lastName", "password"]));
  }

  redirect("/");
}

/**
 * Accepts an invitation for an account that already exists and is signed in:
 * a place in another institution, or on the content team.
 *
 * Either changes what the session can do, so it is renewed straight away. A
 * new platform role is read by the API's role checks from the access token,
 * which would otherwise refuse the content screens until it next expired. And
 * someone with no institution to be in, such as a content manager, is put in
 * the one they just joined; anyone already in one stays there.
 */
export async function joinWithInvite(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let joined: InviteJoined;

  try {
    joined = await apiRequest<InviteJoined>("/api/invites/join", {
      method: "POST",
      body: { token: text(formData, "token") },
    });

    const refreshToken = await readRefreshToken();

    if (refreshToken) {
      await startSession(
        await apiRequest<AuthSession>("/api/auth/refresh", {
          method: "POST",
          authenticated: false,
          body: { refreshToken },
        }),
      );
    }
  } catch (error) {
    return toFormState(error, []);
  }

  redirect(joined.kind === "CONTENT_TEAM" ? "/content/academy" : "/");
}

export async function requestPasswordReset(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData, "email");
  const missing = missingValues({ email });
  const keep = (state: FormState) => keepValues(state, formData, ["email"]);

  if (missing) {
    return keep(missing);
  }

  try {
    await apiRequest("/api/auth/forgot-password", {
      method: "POST",
      authenticated: false,
      body: { email },
      clientAddress: await forwardedClientAddress(),
    });
  } catch (error) {
    return keep(toFormState(error, ["email"]));
  }

  /*
    The API answers the same way whether or not the account exists, and so does
    this. Saying "no account with that email" would turn the form into a way of
    discovering who is registered.
  */
  return {
    status: "success",
    message:
      "If an account exists for that email, a link to reset its password is on its way.",
  };
}

export async function resetPassword(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = text(formData, "token");
  const password = text(formData, "password");
  const confirmation = text(formData, "passwordConfirmation");
  const missing = missingValues({ password });

  if (missing) {
    return missing;
  }

  if (password !== confirmation) {
    return {
      status: "error",
      errors: { passwordConfirmation: "The two passwords do not match." },
    };
  }

  try {
    await apiRequest("/api/auth/reset-password", {
      method: "POST",
      authenticated: false,
      body: { token, password },
    });
  } catch (error) {
    return toFormState(error, ["password"]);
  }

  redirect("/sign-in?reset=done");
}
