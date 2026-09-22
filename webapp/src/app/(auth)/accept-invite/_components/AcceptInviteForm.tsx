"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { acceptInvite } from "@/lib/actions/auth";
import { idleFormState } from "@/lib/actions/form-state";
import { authContent } from "@/content/auth";

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(acceptInvite, idleFormState);
  const content = authContent.acceptInvite;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormStatus state={state} busy={pending ? content.busyLabel : undefined} />

      <input name="token" type="hidden" value={token} />

      {/* The invitation fixes the address, so it is shown but not editable. */}
      <Field label={authContent.labels.email} name="invited-email">
        {({ id }) => (
          <input className={fieldClass} disabled id={id} readOnly type="email" value={email} />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          error={state.errors?.firstName}
          label={authContent.labels.firstName}
          name="firstName"
          required
        >
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autoComplete="given-name"
              className={fieldClass}
              id={id}
              name="firstName"
              required
              type="text"
            />
          )}
        </Field>

        <Field
          error={state.errors?.lastName}
          label={authContent.labels.lastName}
          name="lastName"
          required
        >
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autoComplete="family-name"
              className={fieldClass}
              id={id}
              name="lastName"
              required
              type="text"
            />
          )}
        </Field>
      </div>

      <Field
        error={state.errors?.password}
        hint={authContent.hints.newPassword}
        label={authContent.labels.password}
        name="password"
        required
      >
        {({ id, describedBy, invalid }) => (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid}
            autoComplete="new-password"
            className={fieldClass}
            id={id}
            name="password"
            required
            type="password"
          />
        )}
      </Field>

      <Button busy={pending} className="w-full" icon="none" type="submit">
        {pending ? content.busyLabel : content.submitLabel}
      </Button>

      <p className="type-caption text-farm-muted">{authContent.requiredNote}</p>
    </form>
  );
}
