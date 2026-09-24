"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Icon } from "@farmclub/design-system/Icon";
import { FormStatus } from "@/components/form/FormStatus";
import { academy } from "@/content/academy";
import { idleFormState } from "@/lib/actions/form-state";
import { completeLesson } from "@/lib/actions/learning";

/*
  Marking a lesson done.

  A form posting to a Server Action rather than an onClick: the API call needs
  the access token, which lives in an httpOnly cookie the browser cannot read.

  `alreadyComplete` comes from the server and is not kept in state here. After
  the action runs the page re-renders with the new value, so one source of
  truth rather than two that can disagree.
*/
export function MarkCompleteForm({
  lessonId,
  alreadyComplete,
}: {
  lessonId: string;
  alreadyComplete: boolean;
}) {
  const [state, action, pending] = useActionState(completeLesson, idleFormState);
  const done = alreadyComplete || state.status === "success";

  return (
    <form action={action} className="grid gap-4">
      <input name="lessonId" type="hidden" value={lessonId} />
      <FormStatus busy={pending ? academy.lesson.completing : undefined} state={state} />

      {done && state.status !== "success" ? (
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-farm-green-700">
          <Icon name="tick" size={20} />
          {academy.lesson.completed}
        </p>
      ) : null}

      {done ? null : (
        <Button busy={pending} className="w-fit" icon="none" type="submit">
          {pending ? academy.lesson.completing : academy.lesson.markComplete}
        </Button>
      )}
    </form>
  );
}
