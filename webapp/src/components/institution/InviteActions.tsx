"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { useReportedAction, type FormAction } from "@/components/ui/ActionOutcome";
import { institutionContent } from "@/content/institution";
import { idleFormState } from "@/lib/actions/form-state";

/*
  Resend and revoke, as two separate forms. Each is its own Server Action with
  its own busy and result state, so pressing one never shows the other as
  working.

  A resent invitation stays on the list, so "Sent again" is shown here. A
  revoked one leaves the list, and these buttons with it, so its result is
  reported to the page instead (`ActionOutcome`, which both pages using this
  provide); only a refusal to revoke is shown here.

  The actions are passed in: an institution administrator's act on their own
  institution, a platform administrator's on the one named in `institutionId`.
*/
export function InviteActions({
  inviteId,
  email,
  institutionId,
  resendAction,
  revokeAction,
}: {
  inviteId: string;
  /** Who it was sent to: for the result, and to tell the buttons apart. */
  email: string;
  /** Only for the platform's actions, which work on any institution. */
  institutionId?: string;
  resendAction: FormAction;
  revokeAction: FormAction;
}) {
  const [resent, resend, resending] = useActionState(resendAction, idleFormState);
  const [revoked, revoke, revoking] = useReportedAction(revokeAction);
  const copy = institutionContent.members.pending;
  const target = <span className="sr-only"> {copy.target(email)}</span>;

  const fields = (
    <>
      <input name="inviteId" type="hidden" value={inviteId} />
      <input name="email" type="hidden" value={email} />
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
            {target}
          </Button>
        </form>
        <form action={revoke}>
          {fields}
          <Button busy={revoking} icon="none" type="submit" variant="secondary">
            {revoking ? copy.working : copy.revoke}
            {target}
          </Button>
        </form>
      </div>
      <FormStatus state={revoked.status === "error" ? revoked : resent} />
    </div>
  );
}
