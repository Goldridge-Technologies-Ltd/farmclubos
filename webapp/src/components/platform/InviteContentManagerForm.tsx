"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { platformContent } from "@/content/platform";
import { idleFormState } from "@/lib/actions/form-state";
import { inviteContentManager } from "@/lib/actions/platform";

/*
  Invites a content manager. No role is offered: the content team takes
  content managers only, and a platform administrator is never made by
  invitation.
*/
export function InviteContentManagerForm() {
  const [state, action, pending] = useActionState(inviteContentManager, idleFormState);
  const copy = platformContent.contentTeam.invite;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormStatus busy={pending ? copy.busy : undefined} state={state} />

      <Field error={state.errors?.email} label={copy.email} name="email" required>
        {({ id, describedBy, invalid }) => (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid}
            autoComplete="off"
            className={fieldClass}
            id={id}
            defaultValue={state.values?.email}
            name="email"
            required
            type="email"
          />
        )}
      </Field>

      <Button busy={pending} className="w-fit" icon="none" type="submit">
        {pending ? copy.busy : copy.submit}
      </Button>
    </form>
  );
}
