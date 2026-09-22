"use server";

import { redirect } from "next/navigation";
import { apiRequest } from "../api/client";
import type { AuthSession, MembershipSummary } from "../api/contracts";
import { endSession, readRefreshToken, startSession } from "../session";
import { safeRedirectPath } from "../session-cookies";
import { missingValues, text, toFormState, type FormState } from "./form-state";

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

  if (missing) {
    return missing;
  }

  try {
    const session = await apiRequest<AuthSession>("/api/auth/login", {
      method: "POST",
      authenticated: false,
      body: { email, password },
    });

    await startSession(session);
  } catch (error) {
    return toFormState(error, ["email", "password"]);
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

  if (missing) {
    return missing;
  }

  try {
    const session = await apiRequest<AuthSession>("/api/invites/accept", {
      method: "POST",
      authenticated: false,
      body: { token, firstName, lastName, password },
    });

    await startSession(session);
  } catch (error) {
    return toFormState(error, ["firstName", "lastName", "password"]);
  }

  redirect("/");
}

/** Adds an institution to an account that already exists and is signed in. */
export async function joinWithInvite(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await apiRequest<MembershipSummary>("/api/invites/join", {
      method: "POST",
      body: { token: text(formData, "token") },
    });
  } catch (error) {
    return toFormState(error, []);
  }

  redirect("/");
}

export async function requestPasswordReset(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData, "email");
  const missing = missingValues({ email });

  if (missing) {
    return missing;
  }

  try {
    await apiRequest("/api/auth/forgot-password", {
      method: "POST",
      authenticated: false,
      body: { email },
    });
  } catch (error) {
    return toFormState(error, ["email"]);
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
