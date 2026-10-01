"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { HiddenFields } from "@/components/form/HiddenFields";
import type { FormAction } from "@/components/ui/ActionOutcome";
import { authoringContent } from "@/content/authoring";
import { idleFormState } from "@/lib/actions/form-state";

/*
  A module's or lesson's title and summary: adding one, or changing its own.
  Adding redirects to what was added, so that form only ever shows an error;
  saving stays, and says so.
*/
export function DetailsForm({
  action,
  fields,
  saved,
  submitLabel,
  busyLabel,
}: {
  action: FormAction;
  /** The ids the action needs. */
  fields: Record<string, string>;
  /** What it holds now, when editing. */
  saved?: { title: string; summary: string | null };
  submitLabel: string;
  busyLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, idleFormState);
  const copy = authoringContent.fields;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <HiddenFields fields={fields} />
      <FormStatus busy={pending ? busyLabel : undefined} state={state} />

      <Field error={state.errors?.title} label={copy.title} name="title" required>
        {({ id, describedBy, invalid }) => (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={fieldClass}
            defaultValue={state.values?.title ?? saved?.title}
            id={id}
            maxLength={200}
            name="title"
            required
          />
        )}
      </Field>

      <Field error={state.errors?.summary} hint={copy.summaryHint} label={copy.summary} name="summary">
        {({ id, describedBy, invalid }) => (
          <textarea
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={`${fieldClass} min-h-36 py-3 leading-6`}
            defaultValue={state.values?.summary ?? saved?.summary ?? ""}
            id={id}
            maxLength={1000}
            name="summary"
          />
        )}
      </Field>

      <p className="type-caption text-farm-muted">{copy.requiredNote}</p>

      <Button busy={pending} className="w-fit" icon="none" type="submit">
        {pending ? busyLabel : submitLabel}
      </Button>
    </form>
  );
}
