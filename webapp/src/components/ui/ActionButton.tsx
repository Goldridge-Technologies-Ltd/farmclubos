"use client";

import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { HiddenFields } from "@/components/form/HiddenFields";
import { idleFormState } from "@/lib/actions/form-state";
import { useReportedAction, type FormAction } from "./ActionOutcome";

/*
  A one-press action that needs no confirmation because it takes nothing away
  — reopening an intake, enrolling someone again — but whose button, like
  ConfirmAction's, is usually gone once it succeeds. So the success is
  reported to the page (`ActionOutcome`), and only a refusal shows here.
*/
export function ActionButton({
  action,
  fields,
  label,
  target,
  busyLabel,
}: {
  action: FormAction;
  /** The ids the action needs. */
  fields: Record<string, string>;
  label: string;
  /** Who or what it acts on, read after the label but not shown. */
  target?: string;
  busyLabel: string;
}) {
  const [state, formAction, pending] = useReportedAction(action);

  return (
    <form action={formAction} className="grid gap-2">
      <HiddenFields fields={fields} />
      <Button busy={pending} className="w-fit" icon="none" type="submit" variant="secondary">
        {pending ? busyLabel : label}
        {target ? <span className="sr-only"> {target}</span> : null}
      </Button>
      <FormStatus
        busy={pending ? busyLabel : undefined}
        state={state.status === "error" ? state : idleFormState}
      />
    </form>
  );
}
