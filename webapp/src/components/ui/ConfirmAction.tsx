"use client";

import { startTransition, useId, useState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { HiddenFields } from "@/components/form/HiddenFields";
import { confirmActionCopy } from "@/content/app";
import { useReportedAction, type FormAction } from "./ActionOutcome";

type ConfirmActionProps = {
  action: FormAction;
  /** Posted with the confirmation: the ids the action needs. */
  fields: Record<string, string>;
  /** The button that asks, such as "Remove". */
  label: string;
  /**
   * Who or what it acts on, read after the label but not shown, so a screen
   * reader can tell a list of "Remove" buttons apart.
   */
  target?: string;
  /** What will happen, in a sentence or two, shown before anything is done. */
  consequence: string;
  /** The button that goes ahead. */
  confirmLabel: string;
  busyLabel: string;
};

/*
  An action that asks first — in place, not in a modal.

  Pressing the button replaces it with what will happen and two buttons: go
  ahead, or cancel. Focus moves to "go ahead", which carries the consequence
  as its description, so a screen reader reads both together. Cancel or Escape
  puts the original button back and returns focus to it.

  A success is reported to the page (`ActionOutcome`), since what this acted
  on usually leaves the list it sat in. A refusal stays here, beside the
  consequence, for another try or a cancel.

  Open, it takes the full width of its row — a wrapping flex row or a grid —
  so the consequence is never squeezed into the column the button sat in.
*/
export function ConfirmAction({ label, target, ...confirmation }: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  // Set by a cancel, so the button that comes back takes focus. Never on the
  // first render, which would pull focus into the middle of the page.
  const [returning, setReturning] = useState(false);

  if (open) {
    return (
      <Confirmation
        {...confirmation}
        onCancel={() => {
          setReturning(true);
          setOpen(false);
        }}
        onDone={() => setOpen(false)}
      />
    );
  }

  return (
    <Button
      // React focuses a button that mounts with autoFocus: only after a cancel.
      autoFocus={returning}
      className="w-fit"
      icon="none"
      onClick={() => {
        setReturning(false);
        setOpen(true);
      }}
      variant="secondary"
    >
      {label}
      {target ? <span className="sr-only"> {target}</span> : null}
    </Button>
  );
}

/*
  Mounted afresh each time it opens, so a refusal from an earlier attempt is
  never still showing when someone asks again.
*/
function Confirmation({
  action,
  fields,
  consequence,
  confirmLabel,
  busyLabel,
  onCancel,
  onDone,
}: Omit<ConfirmActionProps, "label" | "target"> & { onCancel: () => void; onDone: () => void }) {
  const consequenceId = useId();
  const [state, formAction, pending] = useReportedAction(async (previous, formData) => {
    const result = await action(previous, formData);

    if (result.status === "success") {
      // In the action's transition, so it closes as the refreshed page arrives
      // rather than showing the button again beforehand (see useReportedAction).
      startTransition(onDone);
    }

    return result;
  });

  return (
    <div
      className="col-span-full w-full rounded-card border border-farm-border bg-farm-cream-50 p-4 sm:p-5"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) {
          onCancel();
        }
      }}
    >
      <p className="type-body-sm text-farm-charcoal" id={consequenceId}>
        {consequence}
      </p>

      <form action={formAction} className="mt-4 grid gap-3">
        <HiddenFields fields={fields} />
        <FormStatus busy={pending ? busyLabel : undefined} state={state} />

        <div className="flex flex-wrap gap-3">
          <Button
            aria-describedby={consequenceId}
            // Focus goes to the decision, not back to the top of the page.
            autoFocus
            busy={pending}
            icon="none"
            type="submit"
          >
            {pending ? busyLabel : confirmLabel}
          </Button>
          <Button disabled={pending} icon="none" onClick={onCancel} variant="secondary">
            {confirmActionCopy.cancel}
          </Button>
        </div>
      </form>
    </div>
  );
}
