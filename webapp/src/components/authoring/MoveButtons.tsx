"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { HiddenFields } from "@/components/form/HiddenFields";
import type { FormAction } from "@/components/ui/ActionOutcome";
import { authoringContent } from "@/content/authoring";
import { idleFormState } from "@/lib/actions/form-state";

type Direction = "UP" | "DOWN";

/*
  Move up and Move down, as buttons: never drag-and-drop alone, which a
  keyboard or switch user cannot do (the wireframe specification rules it out
  too).

  A moved row is re-rendered in its new place, and moving a focused element
  within the page drops its focus. So once the row arrives, focus goes back to
  the button that was pressed — or to the other, when that end has been
  reached — and a keyboard user can keep moving it.
*/
export function MoveButtons({
  action,
  fields,
  position,
  total,
  target,
}: {
  action: FormAction;
  /** The ids the action needs. */
  fields: Record<string, string>;
  /** Where it is now, from 1. */
  position: number;
  total: number;
  /** What moves, read after each label but not shown. */
  target: string;
}) {
  const [state, formAction, pending] = useActionState(action, idleFormState);
  const wrapper = useRef<HTMLDivElement>(null);
  const pressed = useRef<Direction | null>(null);
  const copy = authoringContent.move;

  useEffect(() => {
    const direction = pressed.current;

    if (!direction) {
      return;
    }

    pressed.current = null;

    const [up, down] = Array.from(wrapper.current?.querySelectorAll("button") ?? []);
    const wanted = direction === "UP" ? up : down;
    const other = direction === "UP" ? down : up;

    (wanted && !wanted.disabled ? wanted : other)?.focus();
  }, [position]);

  if (total <= 1) {
    return null;
  }

  const button = (direction: Direction, label: string, disabled: boolean) => (
    <Button
      busy={pending}
      disabled={disabled}
      icon="none"
      name="direction"
      onClick={() => {
        pressed.current = direction;
      }}
      type="submit"
      value={direction}
      variant="secondary"
    >
      {label}
      <span className="sr-only"> {target}</span>
    </Button>
  );

  return (
    <div ref={wrapper} className="grid gap-2">
      <form action={formAction} className="flex flex-wrap gap-2">
        <HiddenFields fields={fields} />
        {button("UP", copy.up, position <= 1)}
        {button("DOWN", copy.down, position >= total)}
      </form>
      <FormStatus busy={pending ? copy.busy : undefined} state={state} />
    </div>
  );
}
