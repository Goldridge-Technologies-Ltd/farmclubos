"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { joinWithInvite } from "@/lib/actions/auth";
import { idleFormState } from "@/lib/actions/form-state";
import { authContent } from "@/content/auth";

/** For someone already signed in, adding the invited institution. */
export function JoinInviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(joinWithInvite, idleFormState);
  const content = authContent.acceptInvite.alreadyHaveAccount;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormStatus state={state} busy={pending ? content.busyLabel : undefined} />
      <input name="token" type="hidden" value={token} />
      <Button busy={pending} className="w-full" icon="none" type="submit">
        {pending ? content.busyLabel : content.joinLabel}
      </Button>
    </form>
  );
}
