import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { institutionContent } from "@/content/institution";
import type { FormState } from "@/lib/actions/form-state";

const DELIVERY_MODES = ["BLENDED", "IN_PERSON", "ONLINE"] as const;

type CohortValues = {
  name?: string;
  code?: string;
  deliveryMode?: string;
  startsOn?: string;
  endsOn?: string;
};

/*
  An intake's own details, which opening one and editing one share:
  everything but the pathway, which is chosen once and never changed.

  `saved` is what the cohort holds now, on the edit screen. After a refused
  submission, what was typed wins over it (docs/webapp/design-patterns.md §3).

  No capacity field, deliberately: a number there would read as a real figure
  about the platform (AGENTS.md), and nothing enforces one yet.
*/
export function CohortFields({ state, saved = {} }: { state: FormState; saved?: CohortValues }) {
  const copy = institutionContent.newCohort.fields;
  const value = (name: keyof CohortValues) => state.values?.[name] ?? saved[name];

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          error={state.errors?.name}
          hint={copy.nameHint}
          label={copy.name}
          name="name"
          required
        >
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              defaultValue={value("name")}
              id={id}
              maxLength={200}
              name="name"
              required
            />
          )}
        </Field>

        <Field error={state.errors?.code} hint={copy.codeHint} label={copy.code} name="code">
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              defaultValue={value("code")}
              id={id}
              maxLength={50}
              name="code"
            />
          )}
        </Field>
      </div>

      <Field label={copy.deliveryMode} name="deliveryMode">
        {({ id, describedBy }) => (
          <select
            aria-describedby={describedBy}
            className={fieldClass}
            defaultValue={value("deliveryMode") ?? "BLENDED"}
            id={id}
            // React applies a select's defaultValue only when it mounts;
            // keyed so a failed submit remounts it with the choice made.
            key={value("deliveryMode") ?? ""}
            name="deliveryMode"
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
        <Field error={state.errors?.startsOn} label={copy.startsOn} name="startsOn">
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              defaultValue={value("startsOn")}
              id={id}
              name="startsOn"
              type="date"
            />
          )}
        </Field>

        <Field error={state.errors?.endsOn} label={copy.endsOn} name="endsOn">
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              defaultValue={value("endsOn")}
              id={id}
              name="endsOn"
              type="date"
            />
          )}
        </Field>
      </div>
    </>
  );
}
