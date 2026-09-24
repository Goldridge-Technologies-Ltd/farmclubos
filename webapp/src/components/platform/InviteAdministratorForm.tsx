"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { platformContent } from "@/content/platform";
import { idleFormState } from "@/lib/actions/form-state";
import { inviteAdministrator } from "@/lib/actions/platform";

/*
  Invites the person who will run an institution. The role is not offered: a
  platform administrator sets up an institution's administrator, and that
  administrator invites everyone else from their own Members screen.
*/
export function InviteAdministratorForm({ institutionId }: { institutionId: string }) {
  const [state, action, pending] = useActionState(inviteAdministrator, idleFormState);
  const copy = platformContent.detail.invite;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <input name="institutionId" type="hidden" value={institutionId} />
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
