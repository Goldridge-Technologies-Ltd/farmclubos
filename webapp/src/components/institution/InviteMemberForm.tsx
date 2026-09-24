"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { institutionContent } from "@/content/institution";
import { idleFormState } from "@/lib/actions/form-state";
import { inviteMember } from "@/lib/actions/institution";

const ROLES = ["LEARNER", "FACILITATOR", "MENTOR", "INSTITUTION_ADMIN"] as const;

/*
  Sends an invitation. React clears the form once the action finishes; after a
  failure the fields come back from `state.values`, so nothing typed is lost,
  and after a success they come back empty, ready for the next person.
*/
export function InviteMemberForm() {
  const [state, action, pending] = useActionState(inviteMember, idleFormState);
  const copy = institutionContent.members.invite;

  return (
    <form action={action} className="grid gap-4" noValidate>
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
              defaultValue={state.values?.email}
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
              defaultValue={state.values?.role ?? "LEARNER"}
              id={id}
              name="role"
              required
              // React applies a select's defaultValue only when it mounts;
              // keyed so a failed submit remounts it with the choice made.
              key={state.values?.role ?? ""}
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
