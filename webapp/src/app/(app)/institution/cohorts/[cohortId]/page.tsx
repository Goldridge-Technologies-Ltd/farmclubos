import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { ProgressBar } from "@farmclub/design-system/ProgressBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnrolMemberForm } from "@/components/institution/EnrolMemberForm";
import { Panel } from "@/components/ui/Panel";
import { institutionContent } from "@/content/institution";
import { getCohort, listMembers, managedInstitution } from "@/lib/api/institution";
import { formatDay } from "@/lib/format";

type PageProps = { params: Promise<{ cohortId: string }> };

export const metadata: Metadata = { title: "Cohort" };

/*
  One intake: who is on it, how far each has got, and a way to add someone.

  Progress here is each enrolment's own `progressPercent`, which the API
  derives from lessons actually completed — the only kind of figure a screen
  may show.
*/
export default async function CohortPage({ params }: PageProps) {
  const { cohortId } = await params;
  const institution = await managedInstitution();
  const [cohort, members] = await Promise.all([
    getCohort(institution.id, cohortId),
    listMembers(institution.id),
  ]);
  const copy = institutionContent.cohort;
  const cohortsCopy = institutionContent.cohorts;

  const enrolled = new Set(cohort.enrolments.map((enrolment) => enrolment.learner.email));
  const candidates = members
    .filter((member) => !enrolled.has(member.email))
    .map((member) => ({
      email: member.email,
      name: `${member.firstName} ${member.lastName}`.trim(),
      role: institutionContent.roles[member.role],
    }));

  return (
    <div className="app-stack">
      <PageHeader
        actions={
          <Badge tone={cohort.status === "OPEN" || cohort.status === "RUNNING" ? "success" : "neutral"}>
            {cohortsCopy.statuses[cohort.status]}
          </Badge>
        }
        crumbs={[
          { label: institutionContent.crumb },
          { href: "/institution/cohorts", label: cohortsCopy.heading },
          { label: cohort.name },
        ]}
        description={`${cohort.pathway.title} · ${cohortsCopy.deliveryModes[cohort.deliveryMode]} · ${cohortsCopy.dates(
          formatDay(cohort.startsOn) || null,
          formatDay(cohort.endsOn) || null,
        )}`}
        eyebrow={institution.name}
        heading={cohort.name}
      />

      <Panel title={copy.learnersTitle}>
        {cohort.enrolments.length === 0 ? (
          <p className="type-body-sm text-farm-muted">{copy.learnersEmpty}</p>
        ) : (
          <ul className="grid gap-4">
            {cohort.enrolments.map((enrolment) => {
              const name = `${enrolment.learner.firstName} ${enrolment.learner.lastName}`.trim();

              return (
                <li
                  key={enrolment.id}
                  className="grid gap-3 border-b border-farm-border pb-4 last:border-0 last:pb-0 sm:grid-cols-[1fr_16rem] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-farm-green-950">{name}</p>
                    <p className="mt-1 type-caption text-farm-muted">
                      {enrolment.learner.email} · {copy.enrolmentStatuses[enrolment.status]}
                    </p>
                  </div>
                  <ProgressBar label={copy.progressLabel(name)} value={enrolment.progressPercent} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel description={copy.enrol.description} title={copy.enrol.title}>
        {candidates.length === 0 ? (
          <p className="type-body-sm text-farm-muted">
            {copy.enrol.everyoneEnrolled}{" "}
            <Link
              className="font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
              href="/institution/members"
            >
              {copy.enrol.inviteLink}
            </Link>
          </p>
        ) : (
          <EnrolMemberForm candidates={candidates} cohortId={cohort.id} />
        )}
      </Panel>
    </div>
  );
}
