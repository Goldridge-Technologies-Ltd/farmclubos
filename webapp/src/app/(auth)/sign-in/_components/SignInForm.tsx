"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { Notice } from "@farmclub/design-system/Notice";
import { FormStatus } from "@/components/form/FormStatus";
import { signIn } from "@/lib/actions/auth";
import { idleFormState } from "@/lib/actions/form-state";
import { authContent } from "@/content/auth";

/*
  The only interactive part of the sign-in screen, so the only client
  component: the page around it stays on the server.
*/
export function SignInForm({ next, afterReset }: { next: string; afterReset: boolean }) {
  const [state, action, pending] = useActionState(signIn, idleFormState);
  const content = authContent.signIn;

  return (
    <form action={action} className="grid gap-4" noValidate>
      {afterReset ? <Notice tone="success">{content.afterReset}</Notice> : null}

      <FormStatus state={state} busy={pending ? content.busyLabel : undefined} />

      <input name="next" type="hidden" value={next} />

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

      <Field
        error={state.errors?.password}
        label={authContent.labels.password}
        name="password"
        required
      >
        {({ id, describedBy, invalid }) => (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid}
            autoComplete="current-password"
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

      <Link
        className="text-sm font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
        href="/forgot-password"
      >
        {content.forgotPassword}
      </Link>

      <p className="type-caption text-farm-muted">{authContent.requiredNote}</p>
    </form>
  );
}
