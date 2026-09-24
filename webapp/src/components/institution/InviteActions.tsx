"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { institutionContent } from "@/content/institution";
import { idleFormState, type FormState } from "@/lib/actions/form-state";

type InviteAction = (previous: FormState, formData: FormData) => Promise<FormState>;

/*
  Resend and revoke, as two separate forms. Each is its own Server Action with
  its own busy and result state, so pressing one never shows the other as
  working.

  The actions are passed in: an institution administrator's act on their own
  institution, a platform administrator's on the one named in `institutionId`.
*/
export function InviteActions({
  inviteId,
  institutionId,
  resendAction,
  revokeAction,
}: {
  inviteId: string;
  /** Only for the platform's actions, which work on any institution. */
  institutionId?: string;
  resendAction: InviteAction;
  revokeAction: InviteAction;
}) {
  const [resent, resend, resending] = useActionState(resendAction, idleFormState);
  const [revoked, revoke, revoking] = useActionState(revokeAction, idleFormState);
  const copy = institutionContent.members.pending;

  const fields = (
    <>
      <input name="inviteId" type="hidden" value={inviteId} />
      {institutionId ? <input name="institutionId" type="hidden" value={institutionId} /> : null}
    </>
  );

  return (
    <div className="grid gap-2 sm:justify-items-end">
      <div className="flex flex-wrap gap-2">
        <form action={resend}>
          {fields}
          <Button busy={resending} icon="none" type="submit" variant="secondary">
            {resending ? copy.working : copy.resend}
          </Button>
        </form>
        <form action={revoke}>
          {fields}
          <Button busy={revoking} icon="none" type="submit" variant="secondary">
            {revoking ? copy.working : copy.revoke}
          </Button>
        </form>
      </div>
      <FormStatus state={resent.status === "idle" ? revoked : resent} />
    </div>
  );
}
