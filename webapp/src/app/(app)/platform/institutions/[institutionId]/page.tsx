import type { Metadata } from "next";
import { Badge } from "@farmclub/design-system/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { InviteActions } from "@/components/institution/InviteActions";
import { InviteAdministratorForm } from "@/components/platform/InviteAdministratorForm";
import { Panel } from "@/components/ui/Panel";
import { institutionContent } from "@/content/institution";
import { platformContent } from "@/content/platform";
import { resendInstitutionInvite, revokeInstitutionInvite } from "@/lib/actions/platform";
import { listMembers, listPendingInvites } from "@/lib/api/institution";
import { getInstitution } from "@/lib/api/platform";
import { formatDay } from "@/lib/format";

type PageProps = { params: Promise<{ institutionId: string }> };

export const metadata: Metadata = { title: "Institution" };

/*
  One institution, from the platform's side: its details, who runs it, and
  the way to invite the person who will.

  Only administrators are listed. Who the institution's learners are is the
  institution's business, on its own Members screen; the platform needs to
  know that someone is running it, and how many people it has.
*/
export default async function InstitutionPage({ params }: PageProps) {
  const { institutionId } = await params;
  const institution = await getInstitution(institutionId);
  const [members, invites] = await Promise.all([
    listMembers(institution.id),
    listPendingInvites(institution.id),
  ]);

  const copy = platformContent.detail;
  const administrators = members.filter((member) => member.role === "INSTITUTION_ADMIN");
  const adminInvites = invites.filter((invite) => invite.role === "INSTITUTION_ADMIN");
  const address = [institution.addressLine, institution.city, institution.country]
    .filter(Boolean)
    .join(", ");

  const details: { label: string; value: string | null }[] = [
    { label: copy.labels.type, value: platformContent.types[institution.type] },
    { label: copy.labels.contactEmail, value: institution.contactEmail },
    { label: copy.labels.contactPhone, value: institution.contactPhone },
    { label: copy.labels.website, value: institution.website },
    { label: copy.labels.address, value: address || null },
    { label: copy.labels.added, value: formatDay(institution.createdAt) },
  ];
  // Only what the institution has actually given; an empty row says nothing.
  const rows = details.filter((row) => Boolean(row.value));

  return (
    <div className="app-stack">
      <PageHeader
        actions={
          <Badge tone={institution.status === "ACTIVE" ? "success" : "warning"}>
            {platformContent.statuses[institution.status]}
          </Badge>
        }
        crumbs={[
          { label: platformContent.crumb },
          { href: "/platform/institutions", label: platformContent.list.heading },
          { label: institution.name },
        ]}
        description={copy.members(members.length)}
        heading={institution.name}
      />

      <Panel description={copy.administrators.description} title={copy.administrators.title}>
        {administrators.length === 0 ? (
          <p className="type-body-sm text-farm-muted">{copy.administrators.none}</p>
        ) : (
          <ul className="grid gap-3">
            {administrators.map((member) => (
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
                {member.joinedAt ? (
                  <span className="type-caption text-farm-muted">
                    {institutionContent.members.list.joined(formatDay(member.joinedAt))}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel description={copy.invite.description} title={copy.invite.title}>
        <InviteAdministratorForm institutionId={institution.id} />

        <h3 className="mt-8 text-sm font-semibold text-farm-green-950">{copy.pending.title}</h3>
        {adminInvites.length === 0 ? (
          <p className="mt-2 type-body-sm text-farm-muted">{copy.pending.none}</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {adminInvites.map((invite) => (
              <li
                key={invite.id}
                className="grid gap-3 rounded-card border border-farm-border p-4 sm:grid-cols-[1fr_auto] sm:items-start"
              >
                <div>
                  <p className="text-sm font-semibold text-farm-green-950">{invite.email}</p>
                  <p className="mt-1 type-caption text-farm-muted">
                    {institutionContent.members.pending.expires(formatDay(invite.expiresAt))}
                  </p>
                </div>
                <InviteActions
                  institutionId={institution.id}
                  inviteId={invite.id}
                  resendAction={resendInstitutionInvite}
                  revokeAction={revokeInstitutionInvite}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={copy.details}>
        <dl className="grid gap-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-farm-border pb-4 last:border-0 last:pb-0"
            >
              <dt className="text-sm font-semibold text-farm-green-950">{row.label}</dt>
              <dd className="text-sm leading-6 text-farm-muted">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
