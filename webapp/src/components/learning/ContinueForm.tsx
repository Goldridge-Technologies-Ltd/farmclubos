"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { HiddenFields } from "@/components/form/HiddenFields";
import { academy } from "@/content/academy";
import { idleFormState } from "@/lib/actions/form-state";
import { completeScene } from "@/lib/actions/learning";

/*
  Continue, for an enrolled learner: records the scene as finished, then moves
  on. A form posting to a Server Action, since recording needs the access
  token in an httpOnly cookie. Someone not enrolled gets a plain link instead —
  there is nothing to record for them.
*/
export function ContinueForm({
  sceneId,
  next,
  label,
}: {
  sceneId: string;
  /** Where to go once it is recorded: the next scene, or the lesson's end. */
  next: string;
  label: string;
}) {
  const [state, action, pending] = useActionState(completeScene, idleFormState);
  const copy = academy.scene;

  return (
    <form action={action} className="grid gap-3">
      <HiddenFields fields={{ sceneId, next }} />
      <FormStatus busy={pending ? copy.saving : undefined} state={state} />
      <Button busy={pending} className="w-fit" type="submit">
        {pending ? copy.saving : label}
      </Button>
    </form>
  );
}
