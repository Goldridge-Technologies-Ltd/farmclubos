"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { institutionContent } from "@/content/institution";
import { idleFormState } from "@/lib/actions/form-state";
import { createCohort } from "@/lib/actions/institution";

const DELIVERY_MODES = ["BLENDED", "IN_PERSON", "ONLINE"] as const;

/*
  Opening an intake. On success the action redirects to the new cohort, so
  learners can be enrolled straight away; this form only ever shows an error.

  No capacity field, deliberately: a number there would read as a real figure
  about the platform (AGENTS.md), and nothing enforces one yet.
*/
export function CreateCohortForm({
  pathways,
}: {
  pathways: { slug: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(createCohort, idleFormState);
  const copy = institutionContent.newCohort;

  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormStatus busy={pending ? copy.busy : undefined} state={state} />

      <Field error={state.errors?.pathwaySlug} label={copy.fields.pathway} name="pathwaySlug" required>
        {({ id, describedBy, invalid }) => (
          <select
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={fieldClass}
            defaultValue={state.values?.pathwaySlug ?? ""}
            id={id}
            name="pathwaySlug"
            required
            // React applies a select's defaultValue only when it mounts;
            // keyed so a failed submit remounts it with the choice made.
            key={state.values?.pathwaySlug ?? ""}
          >
            <option disabled value="">
              {copy.fields.pathwayPlaceholder}
            </option>
            {pathways.map((pathway) => (
              <option key={pathway.slug} value={pathway.slug}>
                {pathway.title}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          error={state.errors?.name}
          hint={copy.fields.nameHint}
          label={copy.fields.name}
          name="name"
          required
        >
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              id={id}
              maxLength={200}
              defaultValue={state.values?.name}
              name="name"
              required
            />
          )}
        </Field>

        <Field error={state.errors?.code} hint={copy.fields.codeHint} label={copy.fields.code} name="code">
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              id={id}
              maxLength={50}
              defaultValue={state.values?.code}
              name="code"
            />
          )}
        </Field>
      </div>

      <Field label={copy.fields.deliveryMode} name="deliveryMode">
        {({ id, describedBy }) => (
          <select
            aria-describedby={describedBy}
            className={fieldClass}
            defaultValue={state.values?.deliveryMode ?? "BLENDED"}
            id={id}
            name="deliveryMode"
            // React applies a select's defaultValue only when it mounts;
            // keyed so a failed submit remounts it with the choice made.
            key={state.values?.deliveryMode ?? ""}
          >
            {DELIVERY_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {institutionContent.cohorts.deliveryModes[mode]}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field error={state.errors?.startsOn} label={copy.fields.startsOn} name="startsOn">
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              id={id}
              defaultValue={state.values?.startsOn}
              name="startsOn"
              type="date"
            />
          )}
        </Field>

        <Field error={state.errors?.endsOn} label={copy.fields.endsOn} name="endsOn">
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              id={id}
              defaultValue={state.values?.endsOn}
              name="endsOn"
              type="date"
            />
          )}
        </Field>
      </div>

      <p className="type-caption text-farm-muted">{copy.requiredNote}</p>

      <Button busy={pending} className="w-fit" icon="none" type="submit">
        {pending ? copy.busy : copy.submit}
      </Button>
    </form>
  );
}
