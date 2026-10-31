import type { Metadata } from "next";
import { Badge } from "@farmclub/design-system/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { platformContent } from "@/content/platform";
import type { Readiness, ServiceVersion } from "@/lib/api/contracts";
import { assertPlatformAdministrator, getApiReadiness, getApiVersion } from "@/lib/api/platform";
import { shortCommit, webVersion } from "@/lib/version";

/** Checked here as well, so anyone else gets "Page not found" in the tab too. */
export async function generateMetadata(): Promise<Metadata> {
  await assertPlatformAdministrator();

  return { title: "System" };
}

/*
  The deployment, from the platform's side: which commit each part runs, and
  whether the API can serve. It answers "is that fix live yet?" without the
  hosting dashboards, and says plainly when the API does not answer, since
  that is part of what someone opening this page needs to know.
*/
export default async function SystemPage() {
  const [api, readiness] = await Promise.all([getApiVersion(), getApiReadiness()]);
  const web = webVersion();
  const copy = platformContent.system;

  const rows = [
    { label: copy.version.web, value: describe(web, web.environment) },
    { label: copy.version.api, value: api ? describe(api, null) : copy.version.noAnswer },
  ];

  return (
    <div className="app-stack">
      <PageHeader
        crumbs={[{ label: platformContent.crumb }, { label: copy.heading }]}
        description={copy.description}
        eyebrow={copy.eyebrow}
        heading={copy.heading}
      />

      <Panel description={copy.version.description} title={copy.version.title}>
        <dl className="grid gap-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-farm-border pb-4 last:border-0 last:pb-0"
            >
              <dt className="text-sm font-semibold text-farm-green-950">{row.label}</dt>
              <dd className="text-sm leading-6 text-farm-charcoal">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel
        action={<StatusBadge readiness={readiness} />}
        description={copy.status.description}
        title={copy.status.title}
      >
        {readiness ? (
          <ul className="grid gap-3">
            {Object.entries(readiness.checks).map(([check, state]) => (
              <li key={check} className="flex flex-wrap items-baseline justify-between gap-2 text-sm leading-6">
                <span className="font-semibold text-farm-green-950">{copy.status.checks[check] ?? check}</span>
                <span className={state === "ok" ? "text-farm-success" : "font-semibold text-farm-danger"}>
                  {state === "ok" ? copy.status.ok : copy.status.down}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="type-body-sm text-farm-muted">{copy.status.noAnswer}</p>
        )}
      </Panel>
    </div>
  );
}

/** "ab8b86b on main · production", or that the host does not say. */
function describe(version: ServiceVersion, environment: string | null): string {
  const copy = platformContent.system.version;

  if (!version.commit) {
    return copy.notReported;
  }

  return [
    shortCommit(version.commit),
    version.branch ? copy.on(version.branch) : null,
    environment ? `· ${copy.environments[environment] ?? environment}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function StatusBadge({ readiness }: { readiness: Readiness | null }) {
  const copy = platformContent.system.status;

  if (!readiness) {
    return <Badge tone="warning">{copy.unreachable}</Badge>;
  }

  return readiness.status === "ok" ? (
    <Badge tone="success">{copy.ready}</Badge>
  ) : (
    <Badge tone="danger">{copy.degraded}</Badge>
  );
}
