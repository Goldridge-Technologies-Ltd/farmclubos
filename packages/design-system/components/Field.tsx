import type { ReactNode } from "react";

/*
  The field anatomy every FARMCLUB OS form uses (docs/design-system.md §11):
  a label above its control, and the error *outside* the label so a screen
  reader announces it once — through aria-describedby — rather than again as
  part of the label.

  The control is a render function so the ids can be handed to it. Wiring
  aria-invalid and aria-describedby by hand at every call site is the part that
  silently rots: a renamed field leaves the error unannounced, and nothing
  visibly breaks.
*/

export type FieldControl = {
  /** Put on the control, so clicking the label focuses it. */
  id: string;
  /** `aria-describedby`: the error, the hint, both, or undefined. */
  describedBy: string | undefined;
  /** `aria-invalid`. */
  invalid: boolean;
};

type FieldProps = {
  label: string;
  /** Usually the control's `name`. Ids are derived from it, so keep it unique. */
  name: string;
  /** Renders the error and marks the control invalid. */
  error?: string;
  /** Guidance shown under the label, announced with the control. */
  hint?: string;
  required?: boolean;
  className?: string;
  children: (control: FieldControl) => ReactNode;
};

export function Field({
  label,
  name,
  error,
  hint,
  required = false,
  className = "",
  children,
}: FieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  /*
    content-start: beside a taller neighbour in a two-column row — one with a
    hint or an error — the row stretches this field to match, and a plain grid
    would share the extra height out among its rows, swelling the input.
    Packing the rows at the top keeps every control its own height.
  */
  return (
    <div className={`grid content-start gap-1.5 ${className}`.trim()}>
      <label className="text-xs font-semibold text-farm-green-950" htmlFor={name}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-farm-green-700">
            {" "}
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <p className="type-caption text-farm-muted" id={hintId}>
          {hint}
        </p>
      ) : null}

      {children({ id: name, describedBy, invalid: Boolean(error) })}

      {error ? (
        <span className="text-sm font-semibold text-farm-danger" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
