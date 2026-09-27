import { ApiError } from "../api/errors";
import { keepValues, missingValues, toFormState } from "./form-state";

/*
  If a message is put under the wrong field, or dropped entirely, the form just
  looks like it rejected a valid submission for no reason.
*/
describe("toFormState", () => {
  const validationFailure = (details: string[]) =>
    new ApiError(400, "VALIDATION_FAILED", "The request did not pass validation.", details);

  it("puts each message under the field it names", () => {
    const state = toFormState(
      validationFailure([
        "email must be an email",
        "password must be longer than or equal to 10 characters",
      ]),
      ["email", "password"],
    );

    expect(state.status).toBe("error");
    expect(state.errors).toEqual({
      email: "Email must be an email.",
      password: "Password must be longer than or equal to 10 characters.",
    });
    // Field errors are shown under the fields, so nothing repeats above them.
    expect(state.message).toBeUndefined();
  });

  it("shows a message with no matching field above the form, never dropping it", () => {
    const state = toFormState(validationFailure(["token must be a string"]), ["password"]);

    expect(state.message).toBe("Token must be a string.");
    expect(state.errors).toBeUndefined();
  });

  it("does not match a field whose name is merely a prefix of the message", () => {
    // "passwordConfirmation ..." must not land under "password".
    const state = toFormState(
      validationFailure(["passwordConfirmation should not be empty"]),
      ["password"],
    );

    expect(state.errors).toBeUndefined();
    expect(state.message).toBe("PasswordConfirmation should not be empty.");
  });

  it("puts a refusal about one field under that field, found by its code", () => {
    const state = toFormState(
      new ApiError(409, "CODE_TAKEN", "Another cohort in this institution already uses that code."),
      ["name", "code"],
      { CODE_TAKEN: "code" },
    );

    expect(state.errors).toEqual({
      code: "Another cohort in this institution already uses that code.",
    });
    expect(state.message).toBeUndefined();
  });

  it("leaves a code it was not given a field for above the form", () => {
    const state = toFormState(new ApiError(404, "NOT_FOUND", "Cohort not found."), ["code"], {
      CODE_TAKEN: "code",
    });

    expect(state.message).toBe("Cohort not found.");
    expect(state.errors).toBeUndefined();
  });

  it("shows the API's own sentence when the failure is not a validation one", () => {
    const state = toFormState(
      new ApiError(401, "INVALID_CREDENTIALS", "The email or password is incorrect."),
      ["email", "password"],
    );

    expect(state.message).toBe("The email or password is incorrect.");
    expect(state.errors).toBeUndefined();
  });

  it("falls back to wording that blames nobody when the failure is unknown", () => {
    const state = toFormState(new Error("socket hang up"), ["email"]);

    expect(state.message).toBe("Something went wrong. Try again.");
  });

  it("keeps only the first message per field, so one field shows one error", () => {
    const state = toFormState(
      validationFailure(["email must be an email", "email should not be empty"]),
      ["email"],
    );

    expect(state.errors).toEqual({ email: "Email must be an email." });
  });
});

describe("missingValues", () => {
  it("passes when everything is filled in", () => {
    expect(missingValues({ email: "ada@example.com", password: "a passphrase" })).toBeNull();
  });

  it("flags only the empty fields", () => {
    expect(missingValues({ email: "", password: "a passphrase" })).toEqual({
      status: "error",
      errors: { email: "This is required." },
    });
  });
});

/*
  React resets every uncontrolled field once a form's action finishes — even
  when the action failed. Without the submitted values handed back, a wrong
  password wipes the email too, and one bad field empties a whole form.
*/
describe("keepValues", () => {
  const formData = (entries: Record<string, string>) => {
    const data = new FormData();
    for (const [name, value] of Object.entries(entries)) data.append(name, value);
    return data;
  };

  it("hands back the named fields, so the form can show them again", () => {
    const state = keepValues(
      { status: "error", message: "The email or password is incorrect." },
      formData({ email: "ada@example.com", password: "secret passphrase" }),
      ["email"],
    );

    expect(state).toEqual({
      status: "error",
      message: "The email or password is incorrect.",
      values: { email: "ada@example.com" },
    });
  });

  it("never hands back a field it was not asked for, so a password is never echoed", () => {
    const state = keepValues(
      { status: "error" },
      formData({ email: "ada@example.com", password: "secret passphrase" }),
      ["email"],
    );

    expect(JSON.stringify(state)).not.toContain("secret passphrase");
  });

  it("keeps what was typed, trimmed the way the action read it", () => {
    expect(
      keepValues({ status: "error" }, formData({ name: "  Ada  " }), ["name"]).values,
    ).toEqual({ name: "Ada" });
  });

  it("gives an empty string for a field that was not sent, rather than dropping it", () => {
    expect(keepValues({ status: "error" }, formData({}), ["code"]).values).toEqual({ code: "" });
  });
});
