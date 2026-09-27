import type { Metadata } from "next";
import { Badge } from "@farmclub/design-system/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { InviteActions } from "@/components/institution/InviteActions";
import { InviteMemberForm } from "@/components/institution/InviteMemberForm";
import { ActionOutcome, ActionOutcomeMessage } from "@/components/ui/ActionOutcome";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Panel } from "@/components/ui/Panel";
import { institutionContent } from "@/content/institution";
import { removeMember, resendInvite, revokeInvite } from "@/lib/actions/institution";
import { listMembers, listPendingInvites, managedInstitution } from "@/lib/api/institution";
import { formatDay } from "@/lib/format";
import { getSessionContext } from "@/lib/session";

export const metadata: Metadata = { title: "Members" };

/*
  Who belongs to the institution, and who has been asked to.

  Inviting comes first on the page because it is the only way anyone joins:
  a person must accept an invitation before they can be enrolled on anything.

  Removing someone asks first, saying what goes with them: their open cohort
  places, counted by the API. The last administrator is offered no Remove at
  all — the API would refuse it, and a button that can only fail is worse
  than a line saying why it is not there.
*/
export default async function MembersPage() {
  const [institution, session] = await Promise.all([managedInstitution(), getSessionContext()]);
  const [members, invites] = await Promise.all([
    listMembers(institution.id),
    listPendingInvites(institution.id),
  ]);
  const copy = institutionContent.members;
  const administrators = members.filter((member) => member.role === "INSTITUTION_ADMIN").length;

  return (
    <ActionOutcome>
      <div className="app-stack">
        <PageHeader
          crumbs={[{ label: institutionContent.crumb }, { label: copy.heading }]}
          description={copy.description}
          eyebrow={institution.name}
          heading={copy.heading}
        />

        <ActionOutcomeMessage />

        <Panel description={copy.invite.description} title={copy.invite.title}>
          <InviteMemberForm />
        </Panel>

        <Panel description={copy.pending.description} title={copy.pending.title}>
          {invites.length === 0 ? (
            <p className="type-body-sm text-farm-muted">{copy.pending.empty}</p>
          ) : (
            <ul className="grid gap-3">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="grid gap-3 rounded-card border border-farm-border p-4 sm:grid-cols-[1fr_auto] sm:items-start"
                >
                  <div>
                    <p className="text-sm font-semibold text-farm-green-950">{invite.email}</p>
                    <p className="mt-1 type-caption text-farm-muted">
                      {institutionContent.roles[invite.role]} ·{" "}
                      {copy.pending.expires(formatDay(invite.expiresAt))}
                    </p>
                  </div>
                  <InviteActions
                    inviteId={invite.id}
                    resendAction={resendInvite}
                    revokeAction={revokeInvite}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={copy.list.title}>
          {members.length === 0 ? (
            <p className="type-body-sm text-farm-muted">{copy.list.empty}</p>
          ) : (
            <ul className="grid gap-3">
              {members.map((member) => {
                const name = `${member.firstName} ${member.lastName}`.trim() || member.email;
                const onlyAdministrator =
                  member.role === "INSTITUTION_ADMIN" && administrators === 1;

                return (
                  <li
                    key={member.userId}
                    className="flex flex-wrap items-start gap-3 border-b border-farm-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-farm-green-950">{name}</p>
                      <p className="mt-1 type-caption text-farm-muted">{member.email}</p>
                    </div>
                    <div className="grid justify-items-end gap-1.5">
                      <Badge tone={member.role === "INSTITUTION_ADMIN" ? "gold" : "green"}>
                        {institutionContent.roles[member.role]}
                      </Badge>
                      {member.joinedAt ? (
                        <span className="type-caption text-farm-muted">
                          {copy.list.joined(formatDay(member.joinedAt))}
                        </span>
                      ) : null}
                      {onlyAdministrator ? (
                        <span className="type-caption text-farm-muted">
                          {copy.list.onlyAdministrator}
                        </span>
                      ) : null}
                    </div>
                    {onlyAdministrator ? null : (
                      <ConfirmAction
                        action={removeMember}
                        busyLabel={copy.remove.busy}
                        confirmLabel={copy.remove.confirm}
                        consequence={
                          member.userId === session?.user.id
                            ? copy.remove.consequenceForYou(institution.name, member.openEnrolments)
                            : copy.remove.consequence(name, institution.name, member.openEnrolments)
                        }
                        fields={{ userId: member.userId, name }}
                        label={copy.remove.label}
                        target={name}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </ActionOutcome>
  );
}
