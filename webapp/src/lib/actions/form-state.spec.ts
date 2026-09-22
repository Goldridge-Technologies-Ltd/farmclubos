import { ApiError } from "../api/errors";
import { missingValues, toFormState } from "./form-state";

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
