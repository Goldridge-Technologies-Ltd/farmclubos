"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { FormStatus } from "@/components/form/FormStatus";
import { institutionContent } from "@/content/institution";
import { idleFormState } from "@/lib/actions/form-state";
import { resendInvite, revokeInvite } from "@/lib/actions/institution";

/*
  Resend and revoke, as two separate forms. Each is its own Server Action with
  its own busy and result state, so pressing one never shows the other as
  working.
*/
export function InviteActions({ inviteId }: { inviteId: string }) {
  const [resent, resend, resending] = useActionState(resendInvite, idleFormState);
  const [revoked, revoke, revoking] = useActionState(revokeInvite, idleFormState);
  const copy = institutionContent.members.pending;

  return (
    <div className="grid gap-2 sm:justify-items-end">
      <div className="flex flex-wrap gap-2">
        <form action={resend}>
          <input name="inviteId" type="hidden" value={inviteId} />
          <Button busy={resending} icon="none" type="submit" variant="secondary">
            {resending ? copy.working : copy.resend}
          </Button>
        </form>
        <form action={revoke}>
          <input name="inviteId" type="hidden" value={inviteId} />
          <Button busy={revoking} icon="none" type="submit" variant="secondary">
            {revoking ? copy.working : copy.revoke}
          </Button>
        </form>
      </div>
      <FormStatus state={resent.status === "idle" ? revoked : resent} />
    </div>
  );
}
