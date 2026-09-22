"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { requestPasswordReset } from "@/lib/actions/auth";
import { idleFormState } from "@/lib/actions/form-state";
import { authContent } from "@/content/auth";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, idleFormState);
  const content = authContent.forgotPassword;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormStatus state={state} busy={pending ? content.busyLabel : undefined} />

      {/* Once the answer is given it is the same either way, so the form goes. */}
      {state.status === "success" ? null : (
        <>
          <Field
            error={state.errors?.email}
            label={authContent.labels.email}
            name="email"
            required
          >
            {({ id, describedBy, invalid }) => (
              <input
                aria-describedby={describedBy}
                aria-invalid={invalid}
                autoComplete="username"
                className={fieldClass}
                id={id}
                name="email"
                required
                type="email"
              />
            )}
          </Field>

          <Button busy={pending} className="w-full" icon="none" type="submit">
            {pending ? content.busyLabel : content.submitLabel}
          </Button>
        </>
      )}

      <Link
        className="text-sm font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
        href="/sign-in"
      >
        {content.backToSignIn}
      </Link>
    </form>
  );
}
