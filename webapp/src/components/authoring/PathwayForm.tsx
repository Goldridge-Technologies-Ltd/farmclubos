"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { HiddenFields } from "@/components/form/HiddenFields";
import type { FormAction } from "@/components/ui/ActionOutcome";
import { academy } from "@/content/academy";
import { authoringContent } from "@/content/authoring";
import { idleFormState } from "@/lib/actions/form-state";
import type { PathwayLevel } from "@/lib/api/contracts";

const LEVELS: PathwayLevel[] = ["FOUNDATION", "INTERMEDIATE", "ADVANCED"];

/*
  A pathway's own details: adding one, or changing its own. Like DetailsForm,
  but a pathway also has a level and a longer description, and its summary is
  required, since the Academy lists every pathway by it. Adding redirects to
  the new pathway, so that form only ever shows an error; saving stays, and
  says so.
*/
export function PathwayForm({
  action,
  fields,
  saved,
  submitLabel,
  busyLabel,
}: {
  action: FormAction;
  /** The ids the action needs. */
  fields?: Record<string, string>;
  /** What it holds now, when editing. */
  saved?: { title: string; summary: string; description: string | null; level: PathwayLevel };
  submitLabel: string;
  busyLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, idleFormState);
  const copy = authoringContent.fields;
  const pathwayCopy = authoringContent.pathwayFields;
  // A <select> keeps what was chosen through a failed save only when keyed on it.
  const level = state.values?.level || saved?.level || "FOUNDATION";

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {fields ? <HiddenFields fields={fields} /> : null}
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

      <Field
        error={state.errors?.summary}
        hint={pathwayCopy.summaryHint}
        label={copy.summary}
        name="summary"
        required
      >
        {({ id, describedBy, invalid }) => (
          <textarea
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={`${fieldClass} min-h-28 py-3 leading-6`}
            defaultValue={state.values?.summary ?? saved?.summary ?? ""}
            id={id}
            maxLength={1000}
            name="summary"
            required
          />
        )}
      </Field>

      <Field error={state.errors?.level} label={pathwayCopy.level} name="level">
        {({ id, describedBy, invalid }) => (
          <select
            key={level}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={`${fieldClass} sm:max-w-xs`}
            defaultValue={level}
            id={id}
            name="level"
          >
            {LEVELS.map((item) => (
              <option key={item} value={item}>
                {academy.levels[item]}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        error={state.errors?.description}
        hint={pathwayCopy.descriptionHint}
        label={pathwayCopy.description}
        name="description"
      >
        {({ id, describedBy, invalid }) => (
          <textarea
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={`${fieldClass} min-h-36 py-3 leading-6`}
            defaultValue={state.values?.description ?? saved?.description ?? ""}
            id={id}
            maxLength={4000}
            name="description"
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
