"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { PasswordInput } from "@farmclub/design-system/PasswordInput";
import { FormStatus } from "@/components/form/FormStatus";
import { resetPassword } from "@/lib/actions/auth";
import { idleFormState } from "@/lib/actions/form-state";
import { authContent } from "@/content/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, idleFormState);
  const content = authContent.resetPassword;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormStatus state={state} busy={pending ? content.busyLabel : undefined} />

      <input name="token" type="hidden" value={token} />

      <Field
        error={state.errors?.password}
        hint={authContent.hints.newPassword}
        label={authContent.labels.newPassword}
        name="password"
        required
      >
        {({ id, describedBy, invalid }) => (
          <PasswordInput
            {...authContent.passwordToggles.newPassword}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            autoComplete="new-password"
            id={id}
            name="password"
            required
          />
        )}
      </Field>

      <Field
        error={state.errors?.passwordConfirmation}
        label={authContent.labels.confirmPassword}
        name="passwordConfirmation"
        required
      >
        {({ id, describedBy, invalid }) => (
          <PasswordInput
            {...authContent.passwordToggles.confirmPassword}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            autoComplete="new-password"
            id={id}
            name="passwordConfirmation"
            required
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
