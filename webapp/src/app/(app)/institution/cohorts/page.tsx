import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { institutionContent } from "@/content/institution";
import type { CohortListItem } from "@/lib/api/contracts";
import { listCohorts, managedInstitution } from "@/lib/api/institution";
import { isCohortClosed } from "@/lib/cohorts";
import { formatDay } from "@/lib/format";
import { titleAfter } from "@/lib/metadata";

export const generateMetadata = titleAfter(managedInstitution, "Cohorts");

/*
  The institution's intakes, newest first, each with how many are on it.
  Closed intakes are listed apart: they are finished with, but not gone —
  their learners can still finish, and one can be reopened.
*/
export default async function CohortsPage() {
  const institution = await managedInstitution();
  const cohorts = await listCohorts(institution.id);
  const copy = institutionContent.cohorts;
  const current = cohorts.filter((cohort) => !isCohortClosed(cohort.status));
  const past = cohorts.filter((cohort) => isCohortClosed(cohort.status));

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
        <>
          <section aria-labelledby="current-cohorts" className="grid gap-4">
            <h2 className="type-title text-farm-green-950" id="current-cohorts">
              {copy.current.title}
            </h2>
            {current.length === 0 ? (
              <p className="type-body-sm text-farm-muted">{copy.current.empty}</p>
            ) : (
              <CohortList cohorts={current} />
            )}
          </section>

          {past.length > 0 ? (
            <section aria-labelledby="past-cohorts" className="grid gap-4">
              <div>
                <h2 className="type-title text-farm-green-950" id="past-cohorts">
                  {copy.past.title}
                </h2>
                <p className="mt-2 max-w-2xl type-body-sm text-farm-muted">
                  {copy.past.description}
                </p>
              </div>
              <CohortList cohorts={past} />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function CohortList({ cohorts }: { cohorts: CohortListItem[] }) {
  const copy = institutionContent.cohorts;

  return (
    <ul className="grid gap-3">
      {cohorts.map((cohort) => (
        <li key={cohort.id}>
          <Link
            href={`/institution/cohorts/${cohort.id}`}
            className="group flex flex-wrap items-start justify-between gap-4 rounded-panel border border-farm-border bg-white p-6 transition-colors hover:border-farm-border-strong"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge tone={isCohortClosed(cohort.status) ? "neutral" : "success"}>
                  {copy.statuses[cohort.status]}
                </Badge>
                <span className="type-caption text-farm-muted">
                  {copy.deliveryModes[cohort.deliveryMode]}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-farm-green-950">
                {cohort.name}
                {cohort.code ? (
                  <span className="ml-2 text-sm font-medium text-farm-muted">{cohort.code}</span>
                ) : null}
              </h3>
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
  );
}
