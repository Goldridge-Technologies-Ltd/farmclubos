"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { academy } from "@/content/academy";
import { idleFormState } from "@/lib/actions/form-state";
import { startPathway } from "@/lib/actions/learning";

/*
  Starts the pathway on one's own and carries on to `next`: the page it was
  pressed on, which then shows the pathway as started. A refusal — taking it
  with an institution already, or a pathway closed to newcomers — stays here,
  in the API's own words.
*/
export function StartPathwayForm({ pathwaySlug, next }: { pathwaySlug: string; next: string }) {
  const [state, action, pending] = useActionState(startPathway, idleFormState);

  return (
    <form action={action} className="grid gap-3">
      <input name="pathwaySlug" type="hidden" value={pathwaySlug} />
      <input name="next" type="hidden" value={next} />
      <FormStatus state={state} />

      <Button busy={pending} className="w-fit" icon="none" size="md" type="submit">
        {pending ? academy.start.starting : academy.start.action}
      </Button>
    </form>
  );
}
