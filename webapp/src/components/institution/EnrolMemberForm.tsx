"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { institutionContent } from "@/content/institution";
import { idleFormState } from "@/lib/actions/form-state";
import { enrolMember } from "@/lib/actions/institution";

type Candidate = { email: string; name: string; role: string };

/*
  Enrols one of the institution's members. A choice from a list rather than a
  typed email: only an active member can be enrolled, and offering exactly
  those people removes the way to get it wrong.
*/
export function EnrolMemberForm({
  cohortId,
  candidates,
}: {
  cohortId: string;
  candidates: Candidate[];
}) {
  const [state, action, pending] = useActionState(enrolMember, idleFormState);
  const copy = institutionContent.cohort.enrol;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <input name="cohortId" type="hidden" value={cohortId} />
      <FormStatus busy={pending ? copy.busy : undefined} state={state} />

      <Field error={state.errors?.email} label={copy.member} name="email" required>
        {({ id, describedBy, invalid }) => (
          <select
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={fieldClass}
            defaultValue={state.values?.email ?? ""}
            id={id}
            // Re-mounted when the list changes — after an enrolment the server
            // sends it back without the person just added — or when a failed
            // submit returns a choice, since React applies a select's
            // defaultValue only when it mounts.
            key={`${candidates.map((candidate) => candidate.email).join(",")}|${state.values?.email ?? ""}`}
            name="email"
            required
          >
            <option disabled value="">
              {copy.memberPlaceholder}
            </option>
            {candidates.map((candidate) => (
              <option key={candidate.email} value={candidate.email}>
                {candidate.name} · {candidate.email} · {candidate.role}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Button busy={pending} className="w-fit" icon="none" type="submit">
        {pending ? copy.busy : copy.submit}
      </Button>
    </form>
  );
}
