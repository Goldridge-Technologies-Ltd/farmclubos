"use client";

import { createContext, useActionState, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Notice } from "@farmclub/design-system/Notice";
import { idleFormState, type FormState } from "@/lib/actions/form-state";
import { FocusOnMount } from "./FocusOnMount";

/** A Server Action a control posts to, answering with what to show. */
export type FormAction = (previous: FormState, formData: FormData) => Promise<FormState>;

type Outcome = { id: number; message: string };

type OutcomeContext = { outcome: Outcome | null; report: (message: string) => void };

const Context = createContext<OutcomeContext | null>(null);

/*
  Where an action's result goes when the control that took it is gone.

  Removing a member takes their row, and the button in it, off the page;
  withdrawing a learner moves them to another list; closing an intake swaps
  Close for Reopen. A result shown beside the button would vanish with it, and
  focus would fall back to the top of the document. So a page wraps itself in
  this, puts one `ActionOutcomeMessage` where results should appear, and its
  controls report there through `useReportedAction`.
*/
export function ActionOutcome({ children }: { children: ReactNode }) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const lastId = useRef(0);

  const report = useCallback((message: string) => {
    lastId.current += 1;
    setOutcome({ id: lastId.current, message });
  }, []);

  return <Context.Provider value={{ outcome, report }}>{children}</Context.Provider>;
}

/**
 * The latest result. It takes focus when it arrives, as content that replaces
 * what someone was using does (`FocusOnMount`): that brings it into view and
 * has a screen reader read it, where the button they pressed no longer exists.
 */
export function ActionOutcomeMessage() {
  const { outcome } = useOutcome();

  if (!outcome) {
    return null;
  }

  return (
    // Keyed on the result, so a second one takes focus again.
    <FocusOnMount key={outcome.id} className="rounded-button">
      <Notice tone="success">{outcome.message}</Notice>
    </FocusOnMount>
  );
}

/**
 * `useActionState` for a control that reports its success to the page's
 * `ActionOutcomeMessage`. A failure stays with the control — nothing changed,
 * so it is still there — for its own status region to show.
 *
 * The report is made here, once the action answers, rather than by an effect
 * watching the state: the response carrying the result also re-renders the
 * page without the control's row, so the control is unmounted before an
 * effect of its own could run.
 */
export function useReportedAction(action: FormAction) {
  const { report } = useOutcome();

  return useActionState(async (previous: FormState, formData: FormData) => {
    const result = await action(previous, formData);

    if (result.status === "success" && result.message) {
      report(result.message);
    }

    return result;
  }, idleFormState);
}

function useOutcome(): OutcomeContext {
  const context = useContext(Context);

  if (!context) {
    throw new Error("An action that reports its outcome must be inside <ActionOutcome>.");
  }

  return context;
}
