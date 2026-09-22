"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { academy } from "@/content/academy";
import { idleFormState } from "@/lib/actions/form-state";
import { startAttempt } from "@/lib/actions/learning";

/*
  Starts an attempt and follows it. The API decides whether that is a new
  attempt or the one already in progress, so pressing this twice cannot burn
  an attempt or lose saved answers.
*/
export function StartAttemptForm({
  assessmentId,
  returnTo,
  label,
  disabled,
}: {
  assessmentId: string;
  /** The module's path; the attempt lives beneath it. */
  returnTo: string;
  label: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(startAttempt, idleFormState);

  return (
    <form action={action} className="grid gap-3">
      <input name="assessmentId" type="hidden" value={assessmentId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <FormStatus state={state} />

      <Button
        busy={pending}
        className="w-fit"
        disabled={disabled}
        icon="none"
        type="submit"
        variant="secondary"
      >
        {pending ? academy.assessment.starting : label}
      </Button>
    </form>
  );
}
