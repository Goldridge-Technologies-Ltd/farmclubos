import type { Metadata } from "next";
import { Badge } from "@farmclub/design-system/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { InviteActions } from "@/components/institution/InviteActions";
import { InviteContentManagerForm } from "@/components/platform/InviteContentManagerForm";
import { ActionOutcome, ActionOutcomeMessage } from "@/components/ui/ActionOutcome";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Panel } from "@/components/ui/Panel";
import { platformContent } from "@/content/platform";
import {
  removeContentManager,
  resendContentTeamInvite,
  revokeContentTeamInvite,
} from "@/lib/actions/platform";
import { getContentTeam } from "@/lib/api/platform";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = { title: "Content team" };

/*
  The content team, from the platform's side: who builds the Academy, the
  invitations still open, and the way to invite a content manager.

  Platform administrators are listed but cannot be removed: they are on the
  team by role. Removing a content manager takes the role only; their account
  stays, so the result is reported to the page as their row leaves the list.
*/
export default async function ContentTeamPage() {
  const team = await getContentTeam();
  const copy = platformContent.contentTeam;

  return (
    <ActionOutcome>
      <div className="app-stack">
        <PageHeader
          crumbs={[{ label: platformContent.crumb }, { label: copy.heading }]}
          description={copy.description}
          heading={copy.heading}
        />

        <ActionOutcomeMessage />

        <Panel description={copy.members.description} title={copy.members.title}>
          <ul className="grid gap-3">
            {team.members.map((member) => {
              const name = `${member.firstName} ${member.lastName}`;

              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-farm-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-farm-green-950">{name}</p>
                    <p className="mt-1 type-caption text-farm-muted">{member.email}</p>
                  </div>
                  <div className="flex flex-wrap items-start gap-3">
                    <Badge tone={member.platformRole === "PLATFORM_ADMIN" ? "neutral" : "green"}>
                      {copy.members.roles[member.platformRole]}
                    </Badge>
                    {member.platformRole === "CONTENT_MANAGER" ? (
                      <ConfirmAction
                        action={removeContentManager}
                        busyLabel={copy.members.remove.busy}
                        confirmLabel={copy.members.remove.confirm}
                        consequence={copy.members.remove.consequence(name)}
                        fields={{ userId: member.id, name }}
                        label={copy.members.remove.label}
                        target={name}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel description={copy.invite.description} title={copy.invite.title}>
          <InviteContentManagerForm />

          <h3 className="mt-8 text-sm font-semibold text-farm-green-950">{copy.pending.title}</h3>
          {team.invitations.length === 0 ? (
            <p className="mt-2 type-body-sm text-farm-muted">{copy.pending.none}</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {team.invitations.map((invite) => (
                <li
                  key={invite.id}
                  className="grid gap-3 rounded-card border border-farm-border p-4 sm:grid-cols-[1fr_auto] sm:items-start"
                >
                  <div>
                    <p className="text-sm font-semibold text-farm-green-950">{invite.email}</p>
                    <p className="mt-1 type-caption text-farm-muted">
                      {invite.status === "EXPIRED"
                        ? copy.pending.expired(formatDay(invite.expiresAt))
                        : copy.pending.expires(formatDay(invite.expiresAt))}
                    </p>
                  </div>
                  <InviteActions
                    email={invite.email}
                    inviteId={invite.id}
                    resendAction={resendContentTeamInvite}
                    revokeAction={revokeContentTeamInvite}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </ActionOutcome>
  );
}
