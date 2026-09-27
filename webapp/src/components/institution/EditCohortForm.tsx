"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { FormStatus } from "@/components/form/FormStatus";
import { institutionContent } from "@/content/institution";
import { idleFormState } from "@/lib/actions/form-state";
import { updateCohort } from "@/lib/actions/institution";
import { CohortFields } from "./CohortFields";

/*
  Changing an intake's details. The pathway is shown, not offered: the
  progress of everyone on the intake belongs to it. On success the action goes
  back to the cohort, so this form only ever shows an error.
*/
export function EditCohortForm({
  cohort,
}: {
  cohort: {
    id: string;
    pathwayTitle: string;
    name: string;
    code: string | null;
    deliveryMode: string;
    startsOn: string | null;
    endsOn: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateCohort, idleFormState);
  const copy = institutionContent.editCohort;

  return (
    <form action={action} className="grid gap-5" noValidate>
      <input name="cohortId" type="hidden" value={cohort.id} />
      <FormStatus busy={pending ? copy.busy : undefined} state={state} />

      <div>
        <p className="text-xs font-semibold text-farm-green-950">{copy.pathway}</p>
        <p className="mt-1.5 text-sm leading-6 text-farm-charcoal">{cohort.pathwayTitle}</p>
      </div>

      <CohortFields
        saved={{
          name: cohort.name,
          code: cohort.code ?? "",
          deliveryMode: cohort.deliveryMode,
          startsOn: cohort.startsOn ?? "",
          endsOn: cohort.endsOn ?? "",
        }}
        state={state}
      />

      <p className="type-caption text-farm-muted">{institutionContent.newCohort.requiredNote}</p>

      <div className="flex flex-wrap gap-3">
        <Button busy={pending} icon="none" type="submit">
          {pending ? copy.busy : copy.submit}
        </Button>
        <ButtonLink href={`/institution/cohorts/${cohort.id}`} icon="none" size="md" variant="secondary">
          {copy.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
