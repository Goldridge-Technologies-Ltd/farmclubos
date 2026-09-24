import { userMessage, validationMessages } from "../api/errors";

/*
  What a form shows after a submission, and how an API failure becomes that.

  Kept out of the "use server" module on purpose: a file marked "use server"
  may only export async functions, so constants and helpers cannot live there.
  It also makes this logic ordinary code that can be tested directly.
*/

export type FormState = {
  status: "idle" | "error" | "success";
  /** Shown above the form: something wrong with the whole submission. */
  message?: string;
  /** Keyed by the input's name, shown under that field. */
  errors?: Record<string, string>;
  /**
   * What was submitted, for the fields worth showing again. React resets
   * every uncontrolled field when a form's action finishes, even after a
   * failure; a field whose `defaultValue` is its value here is reset to what
   * was typed rather than to nothing. Never holds a password.
   */
  values?: Record<string, string>;
};

export const idleFormState: FormState = { status: "idle" };

export function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * A failure, with the named fields handed back so the form can show them
 * again. List only what is safe to put back into the page — never a password.
 */
export function keepValues(
  state: FormState,
  formData: FormData,
  names: readonly string[],
): FormState {
  return { ...state, values: Object.fromEntries(names.map((name) => [name, text(formData, name)])) };
}

/** Catches an empty submission before troubling the API with it. */
export function missingValues(values: Record<string, string>): FormState | null {
  const errors = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value.length === 0)
      .map(([name]) => [name, "This is required."]),
  );

  return Object.keys(errors).length > 0 ? { status: "error", errors } : null;
}

/**
 * An API failure as the form shows it.
 *
 * The API's validation messages begin with the property they concern
 * ("password must be longer than or equal to 10 characters"), so each one is
 * placed under its own field where the name matches. Anything that matches no
 * field — and any failure that is not a validation failure, such as
 * INVALID_CREDENTIALS — goes above the form instead, so it is never lost.
 */
export function toFormState(error: unknown, fields: string[]): FormState {
  const details = validationMessages(error);
  const errors: Record<string, string> = {};
  const unmatched: string[] = [];

  for (const detail of details) {
    const field = fields.find((name) => detail.startsWith(`${name} `));

    if (field) {
      errors[field] ??= sentence(detail);
    } else {
      unmatched.push(detail);
    }
  }

  const state: FormState = { status: "error" };

  if (Object.keys(errors).length > 0) {
    state.errors = errors;
  }

  if (unmatched.length > 0) {
    state.message = sentence(unmatched[0]);
  } else if (Object.keys(errors).length === 0) {
    state.message = userMessage(error);
  }

  return state;
}

function sentence(value: string): string {
  const trimmed = value.trim();
  const capitalised = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  return capitalised.endsWith(".") ? capitalised : `${capitalised}.`;
}
