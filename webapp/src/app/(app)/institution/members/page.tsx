import type { Metadata } from "next";
import { Badge } from "@farmclub/design-system/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { InviteActions } from "@/components/institution/InviteActions";
import { InviteMemberForm } from "@/components/institution/InviteMemberForm";
import { Panel } from "@/components/ui/Panel";
import { institutionContent } from "@/content/institution";
import { resendInvite, revokeInvite } from "@/lib/actions/institution";
import { listMembers, listPendingInvites, managedInstitution } from "@/lib/api/institution";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = { title: "Members" };

/*
  Who belongs to the institution, and who has been asked to.

  Inviting comes first on the page because it is the only way anyone joins:
  a person must accept an invitation before they can be enrolled on anything.
*/
export default async function MembersPage() {
  const institution = await managedInstitution();
  const [members, invites] = await Promise.all([
    listMembers(institution.id),
    listPendingInvites(institution.id),
  ]);
  const copy = institutionContent.members;

  return (
    <div className="app-stack">
      <PageHeader
        crumbs={[{ label: institutionContent.crumb }, { label: copy.heading }]}
        description={copy.description}
        eyebrow={institution.name}
        heading={copy.heading}
      />

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
            {members.map((member) => (
              <li
                key={member.userId}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-farm-border pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-semibold text-farm-green-950">
                    {member.firstName} {member.lastName}
                  </p>
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
