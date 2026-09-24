"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { platformContent } from "@/content/platform";
import { idleFormState } from "@/lib/actions/form-state";
import { createInstitution } from "@/lib/actions/platform";

const TYPES = [
  "SCHOOL",
  "TECHNICAL_COLLEGE",
  "UNIVERSITY",
  "YOUTH_PROGRAMME",
  "GOVERNMENT_AGENCY",
  "DEVELOPMENT_PARTNER",
  "ENTERPRISE",
  "OTHER",
] as const;

/*
  Adding an institution. On success the action redirects to it, so this form
  only ever shows an error — including the API's own validation, which lands
  under the field it concerns.
*/
export function CreateInstitutionForm() {
  const [state, action, pending] = useActionState(createInstitution, idleFormState);
  const copy = platformContent.create;
  const errors = state.errors ?? {};

  const optional = (
    name: "contactPhone" | "website" | "addressLine" | "city" | "country",
    type = "text",
    hint?: string,
  ) => (
    <Field error={errors[name]} hint={hint} label={copy.fields[name]} name={name}>
      {({ id, describedBy, invalid }) => (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={fieldClass}
          defaultValue={state.values?.[name]}
          id={id}
          name={name}
          type={type}
        />
      )}
    </Field>
  );

  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormStatus busy={pending ? copy.busy : undefined} state={state} />

      <div className="grid gap-5 sm:grid-cols-[1fr_16rem]">
        <Field error={errors.name} label={copy.fields.name} name="name" required>
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autoComplete="organization"
              className={fieldClass}
              id={id}
              maxLength={160}
              defaultValue={state.values?.name}
              name="name"
              required
            />
          )}
        </Field>

        <Field error={errors.type} label={copy.fields.type} name="type" required>
          {({ id, describedBy, invalid }) => (
            <select
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              defaultValue={state.values?.type ?? ""}
              id={id}
              name="type"
              required
              // React applies a select's defaultValue only when it mounts;
              // keyed so a failed submit remounts it with the choice made.
              key={state.values?.type ?? ""}
            >
              <option disabled value="">
                {copy.fields.typePlaceholder}
              </option>
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {platformContent.types[type]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field
        error={errors.contactEmail}
        hint={copy.fields.contactEmailHint}
        label={copy.fields.contactEmail}
        name="contactEmail"
        required
      >
        {({ id, describedBy, invalid }) => (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={fieldClass}
            id={id}
            defaultValue={state.values?.contactEmail}
            name="contactEmail"
            required
            type="email"
          />
        )}
      </Field>

      <fieldset className="grid gap-5 border-t border-farm-border pt-5">
        <legend className="text-sm font-semibold text-farm-green-950">
          {copy.optionalHeading}
          <span className="ml-2 font-normal text-farm-muted">{copy.optionalNote}</span>
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {optional("contactPhone", "tel")}
          {optional("website", "url", copy.fields.websiteHint)}
        </div>
        {optional("addressLine")}
        <div className="grid gap-5 sm:grid-cols-2">
          {optional("city")}
          {optional("country")}
        </div>
      </fieldset>

      <p className="type-caption text-farm-muted">{copy.requiredNote}</p>

      <Button busy={pending} className="w-fit" icon="none" type="submit">
        {pending ? copy.busy : copy.submit}
      </Button>
    </form>
  );
}
