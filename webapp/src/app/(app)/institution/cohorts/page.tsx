import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { institutionContent } from "@/content/institution";
import { listCohorts, managedInstitution } from "@/lib/api/institution";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = { title: "Cohorts" };

/** The institution's intakes, newest first, each with how many are enrolled. */
export default async function CohortsPage() {
  const institution = await managedInstitution();
  const cohorts = await listCohorts(institution.id);
  const copy = institutionContent.cohorts;

  const create = (
    <ButtonLink href="/institution/cohorts/new" icon="none" size="md">
      {copy.create}
    </ButtonLink>
  );

  return (
    <div className="app-stack">
      <PageHeader
        actions={cohorts.length > 0 ? create : undefined}
        crumbs={[{ label: institutionContent.crumb }, { label: copy.heading }]}
        description={copy.description}
        eyebrow={institution.name}
        heading={copy.heading}
      />

      {cohorts.length === 0 ? (
        <EmptyState
          action={create}
          description={copy.empty.description}
          icon="calendar"
          title={copy.empty.title}
        />
      ) : (
        <ul className="grid gap-3">
          {cohorts.map((cohort) => (
            <li key={cohort.id}>
              <Link
                href={`/institution/cohorts/${cohort.id}`}
                className="group flex flex-wrap items-start justify-between gap-4 rounded-panel border border-farm-border bg-white p-6 transition-colors hover:border-farm-border-strong"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge tone={cohort.status === "OPEN" || cohort.status === "RUNNING" ? "success" : "neutral"}>
                      {copy.statuses[cohort.status]}
                    </Badge>
                    <span className="type-caption text-farm-muted">
                      {copy.deliveryModes[cohort.deliveryMode]}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-farm-green-950">
                    {cohort.name}
                    {cohort.code ? (
                      <span className="ml-2 text-sm font-medium text-farm-muted">{cohort.code}</span>
                    ) : null}
                  </h2>
                  <p className="mt-1 type-body-sm text-farm-muted">{cohort.pathway.title}</p>
                  <p className="mt-2 type-caption text-farm-muted">
                    {copy.dates(formatDay(cohort.startsOn) || null, formatDay(cohort.endsOn) || null)}
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 text-sm font-semibold text-farm-green-800">
                  {/* A real count of rows, not an illustration. */}
                  {copy.enrolled(cohort.enrolmentCount)}
                  <Icon
                    name="chevron-right"
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
