import { Notice } from "@farmclub/design-system/Notice";
import type { FormState } from "@/lib/actions/form-state";

/*
  One always-mounted live region per form (docs/design-system.md §11): its
  content is swapped rather than the region being mounted and unmounted, so a
  screen reader announces each change once.
*/
export function FormStatus({ state, busy }: { state: FormState; busy?: string }) {
  return (
    <div className="empty:hidden" role="status">
      {busy ? <Notice tone="busy">{busy}</Notice> : null}
      {!busy && state.status === "error" && state.message ? (
        <Notice tone="error">{state.message}</Notice>
      ) : null}
      {!busy && state.status === "success" && state.message ? (
        <Notice tone="success">{state.message}</Notice>
      ) : null}
    </div>
  );
}
