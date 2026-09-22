import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { appShell, profileScreen } from "@/content/app";
import { getSessionContext } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

/*
  Everything the platform holds about the person signed in, read back to them.

  Every value here comes from the API, so there is nothing illustrative on the
  screen. Editing arrives with the users module's update endpoint; until then
  this is honest about being read-only rather than showing a disabled form.
*/
export default async function ProfilePage() {
  const session = await getSessionContext();

  if (!session) {
    redirect("/sign-in");
  }

  const rows = [
    { label: profileScreen.labels.name, value: `${session.user.firstName} ${session.user.lastName}` },
    { label: profileScreen.labels.email, value: session.user.email },
  ];

  return (
    <div className="app-stack">
      <PageHeader
        crumbs={[{ label: profileScreen.crumb }, { label: profileScreen.heading }]}
        description={profileScreen.description}
        heading={profileScreen.heading}
      />

      <Panel title={profileScreen.details}>
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

      <Panel description={profileScreen.membershipsNote} title={profileScreen.memberships}>
        <ul className="grid gap-3">
          {session.memberships.map((membership) => (
            <li
              key={membership.institutionId}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-card border border-farm-border p-4"
            >
              <span className="text-sm font-semibold text-farm-green-950">
                {membership.institutionName}
              </span>
              <span className="type-caption text-farm-muted">
                {appShell.roles[membership.role]}
              </span>
            </li>
          ))}
          {session.memberships.length === 0 ? (
            <li className="type-body-sm text-farm-muted">{profileScreen.noMemberships}</li>
          ) : null}
        </ul>
      </Panel>
    </div>
  );
}
