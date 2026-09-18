"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { Notice } from "@farmclub/design-system/Notice";

type ContactFormShellProps = {
  enquiryTypes: string[];
  integrationNote?: string;
  /** Legend for the asterisk on required fields. */
  requiredNote?: string;
};

type FieldName =
  | "name"
  | "email"
  | "organisation"
  | "enquiryType"
  | "message"
  | "consent";
type FormErrors = Partial<Record<FieldName, string>>;
type FormStatus = "idle" | "reviewing" | "invalid" | "reviewed";

/*
  Presentation only has changed here. There is still no delivery integration
  (see docs/site/project-brief.md), so the form validates on the device and says so
  plainly rather than implying a message was sent.
*/
export function ContactFormShell({
  enquiryTypes,
  integrationNote = "Online delivery is not connected yet. Nothing entered here will be sent or stored.",
  requiredNote = "Fields marked * are required.",
}: ContactFormShellProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Enter in a text field still submits while the button is busy.
    if (status === "reviewing") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextErrors: FormErrors = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const enquiryType = String(data.get("enquiryType") ?? "");
    const message = String(data.get("message") ?? "").trim();

    if (name.length < 2) nextErrors.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Enter a valid email address.";
    if (!enquiryType) nextErrors.enquiryType = "Select a subject.";
    if (message.length < 20)
      nextErrors.message =
        "Add at least 20 characters so the enquiry has enough context.";
    if (data.get("consent") !== "on")
      nextErrors.consent =
        "Confirm that you understand this interim form does not transmit data.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("invalid");
      return;
    }

    setStatus("reviewing");
    window.setTimeout(() => setStatus("reviewed"), 350);
  }

  return (
    <form
      className="rounded-panel border border-farm-border bg-white p-6 sm:p-8"
      aria-label="Prepare a contact enquiry"
      noValidate
      onSubmit={handleSubmit}
    >
      <h2 className="type-title text-farm-green-950">Send Us a Message</h2>
      <p className="mt-2 text-sm leading-6 text-farm-muted">
        Fill in the form and our team will get back to you as soon as possible.
      </p>
      <p className="mt-1 type-caption text-farm-muted">{requiredNote}</p>

      <div className="mt-6 grid gap-4">
        {/* One live region that stays mounted, so each status change is announced. */}
        <div role="status">
          <FormStatusMessage status={status} integrationNote={integrationNote} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="name" error={errors.name} required>
            {({ id, describedBy, invalid }) => (
              <input
                aria-describedby={describedBy}
                aria-invalid={invalid}
                autoComplete="name"
                className={fieldClass}
                id={id}
                name="name"
                placeholder="Full Name"
                required
                type="text"
              />
            )}
          </Field>
          <Field label="Email address" name="email" error={errors.email} required>
            {({ id, describedBy, invalid }) => (
              <input
                aria-describedby={describedBy}
                aria-invalid={invalid}
                autoComplete="email"
                className={fieldClass}
                id={id}
                name="email"
                placeholder="Email Address"
                required
                type="email"
              />
            )}
          </Field>
        </div>

        <Field label="Organisation / Company" name="organisation">
          {({ id }) => (
            <input
              autoComplete="organization"
              className={fieldClass}
              id={id}
              name="organisation"
              placeholder="Organisation / Company"
              type="text"
            />
          )}
        </Field>

        <Field
          label="Subject"
          name="enquiryType"
          error={errors.enquiryType}
          required
        >
          {({ id, describedBy, invalid }) => (
            <select
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              defaultValue=""
              id={id}
              name="enquiryType"
              required
            >
              <option value="" disabled>
                Select a subject
              </option>
              {enquiryTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Message" name="message" error={errors.message} required>
          {({ id, describedBy, invalid }) => (
            <textarea
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={`${fieldClass} min-h-36 py-3 leading-6`}
              id={id}
              name="message"
              placeholder="Message"
              required
            />
          )}
        </Field>

        <div>
          <label className="flex items-start gap-3 text-sm leading-6 text-farm-muted">
            <input
              className="mt-1 h-4.5 w-4.5 shrink-0 accent-farm-green-800"
              type="checkbox"
              name="consent"
              required
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "consent-error" : undefined}
            />
            <span>
              I understand that this interim form validates my message on this
              device but does not send or store it.
              <span aria-hidden="true" className="text-farm-green-700">
                {" "}
                *
              </span>
            </span>
          </label>
          {errors.consent ? (
            <p
              id="consent-error"
              className="mt-2 text-sm font-semibold text-farm-danger"
              role="alert"
            >
              {errors.consent}
            </p>
          ) : null}
        </div>

        <Button type="submit" busy={status === "reviewing"} className="w-fit">
          {status === "reviewing" ? "Checking…" : "Review Message"}
        </Button>
      </div>
    </form>
  );
}

function FormStatusMessage({
  status,
  integrationNote,
}: {
  status: FormStatus;
  integrationNote: string;
}) {
  if (status === "idle") return <Notice tone="info">{integrationNote}</Notice>;

  if (status === "invalid")
    return (
      <Notice tone="error">Review the highlighted fields. Nothing has been sent.</Notice>
    );

  if (status === "reviewing")
    return <Notice tone="busy">Checking your message locally…</Notice>;

  return (
    <Notice tone="success" title="Your enquiry is complete.">
      Nothing was sent or stored. Email hello@farmclubos.com to reach the team
      while online delivery is being connected.
    </Notice>
  );
}
