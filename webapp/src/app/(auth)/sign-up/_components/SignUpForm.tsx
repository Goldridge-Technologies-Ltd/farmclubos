"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { TermsNotice } from "@/components/form/TermsNotice";
import { signUp } from "@/lib/actions/auth";
import { idleFormState } from "@/lib/actions/form-state";
import { authContent } from "@/content/auth";

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, idleFormState);
  const content = authContent.signUp;

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
                autoComplete="email"
                className={fieldClass}
                id={id}
                defaultValue={state.values?.email}
                name="email"
                required
                type="email"
              />
            )}
          </Field>

          <Button busy={pending} className="w-full" icon="none" type="submit">
            {pending ? content.busyLabel : content.submitLabel}
          </Button>

          <TermsNotice />
        </>
      )}

      <p className="text-sm text-farm-muted">
        {content.haveAccount}{" "}
        <Link
          className="font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
          href="/sign-in"
        >
          {content.signIn}
        </Link>
      </p>
    </form>
  );
}
