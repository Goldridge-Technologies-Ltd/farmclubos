"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { institutionContent } from "@/content/institution";
import { idleFormState } from "@/lib/actions/form-state";
import { inviteMember } from "@/lib/actions/institution";

const ROLES = ["LEARNER", "FACILITATOR", "MENTOR", "INSTITUTION_ADMIN"] as const;

/** Sends an invitation. Clears itself after a success, ready for the next one. */
export function InviteMemberForm() {
  const [state, action, pending] = useActionState(inviteMember, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const copy = institutionContent.members.invite;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4" noValidate>
      <FormStatus busy={pending ? copy.busy : undefined} state={state} />

      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <Field error={state.errors?.email} label={copy.email} name="email" required>
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autoComplete="off"
              className={fieldClass}
              id={id}
              name="email"
              required
              type="email"
            />
          )}
        </Field>

        <Field error={state.errors?.role} label={copy.role} name="role" required>
          {({ id, describedBy, invalid }) => (
            <select
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={fieldClass}
              defaultValue="LEARNER"
              id={id}
              name="role"
              required
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {institutionContent.roles[role]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Button busy={pending} className="w-fit" icon="none" type="submit">
        {pending ? copy.busy : copy.submit}
      </Button>
    </form>
  );
}
