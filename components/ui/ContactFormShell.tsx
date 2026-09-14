"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { fieldClass } from "@/components/ui/form-classes";

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
  (see docs/project-brief.md), so the form validates on the device and says so
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
            <input
              className={fieldClass}
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Full Name"
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>
          <Field label="Email address" name="email" error={errors.email} required>
            <input
              className={fieldClass}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Email Address"
              required
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </Field>
        </div>

        <Field label="Organisation / Company" name="organisation">
          <input
            className={fieldClass}
            type="text"
            name="organisation"
            autoComplete="organization"
            placeholder="Organisation / Company"
          />
        </Field>

        <Field
          label="Subject"
          name="enquiryType"
          error={errors.enquiryType}
          required
        >
          <select
            className={fieldClass}
            name="enquiryType"
            defaultValue=""
            required
            aria-invalid={Boolean(errors.enquiryType)}
            aria-describedby={
              errors.enquiryType ? "enquiryType-error" : undefined
            }
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
        </Field>

        <Field label="Message" name="message" error={errors.message} required>
          <textarea
            className={`${fieldClass} min-h-36 py-3 leading-6`}
            name="message"
            placeholder="Message"
            required
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : undefined}
          />
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

/*
  The error sits outside the label so screen readers announce it once (through
  aria-describedby) rather than again as part of the label.
*/
function Field({
  label,
  name,
  error,
  required = false,
  children,
}: {
  label: string;
  name: FieldName;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-farm-green-950">
          {label}
          {required ? (
            <span aria-hidden="true" className="text-farm-green-700">
              {" "}
              *
            </span>
          ) : null}
        </span>
        {children}
      </label>
      {error ? (
        <span
          id={`${name}-error`}
          className="text-sm font-semibold text-farm-danger"
          role="alert"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}

function FormStatusMessage({
  status,
  integrationNote,
}: {
  status: FormStatus;
  integrationNote: string;
}) {
  if (status === "idle")
    return (
      <p className="rounded-button border border-farm-info-border bg-farm-info-surface p-3.5 text-xs leading-6 text-farm-muted">
        {integrationNote}
      </p>
    );
  if (status === "invalid")
    return (
      <p
        className="rounded-button border border-farm-danger-border bg-farm-danger-surface p-3.5 text-sm font-semibold text-farm-danger-strong"
      >
        Review the highlighted fields. Nothing has been sent.
      </p>
    );
  if (status === "reviewing")
    return (
      <p
        className="rounded-button border border-farm-info-border bg-farm-info-surface p-3.5 text-sm font-semibold text-farm-info"
      >
        Checking your message locally…
      </p>
    );
  return (
    <div
      className="rounded-button border border-farm-success bg-farm-success-surface p-3.5"
    >
      <p className="text-sm font-semibold text-farm-green-950">
        Your enquiry is complete.
      </p>
      <p className="mt-1 text-xs leading-6 text-farm-green-900">
        Nothing was sent or stored. Email hello@farmclubos.com to reach the team
        while online delivery is being connected.
      </p>
    </div>
  );
}
