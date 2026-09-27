"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { institutionContent } from "@/content/institution";
import { idleFormState } from "@/lib/actions/form-state";
import { createCohort } from "@/lib/actions/institution";
import { CohortFields } from "./CohortFields";

/*
  Opening an intake. On success the action redirects to the new cohort, so
  learners can be enrolled straight away; this form only ever shows an error.
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

      <CohortFields state={state} />

      <p className="type-caption text-farm-muted">{copy.requiredNote}</p>

      <Button busy={pending} className="w-fit" icon="none" type="submit">
        {pending ? copy.busy : copy.submit}
      </Button>
    </form>
  );
}
