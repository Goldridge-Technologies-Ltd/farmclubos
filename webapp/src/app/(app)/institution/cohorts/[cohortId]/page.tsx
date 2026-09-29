import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { ProgressBar } from "@farmclub/design-system/ProgressBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnrolMemberForm } from "@/components/institution/EnrolMemberForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionOutcome, ActionOutcomeMessage } from "@/components/ui/ActionOutcome";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Panel } from "@/components/ui/Panel";
import { institutionContent } from "@/content/institution";
import {
  closeCohort,
  enrolAgain,
  reopenCohort,
  withdrawLearner,
} from "@/lib/actions/institution";
import type { CohortEnrolment } from "@/lib/api/contracts";
import { getCohort, listMembers, managedInstitution } from "@/lib/api/institution";
import { isCohortClosed } from "@/lib/cohorts";
import { formatDay } from "@/lib/format";

type PageProps = { params: Promise<{ cohortId: string }> };

export const metadata: Metadata = { title: "Cohort" };

/*
  One intake: who is on it, how far each has got, and running it — enrolling,
  withdrawing, closing.

  Progress here is each enrolment's own `progressPercent`, which the API
  derives from lessons actually completed — the only kind of figure a screen
  may show. A withdrawn learner keeps theirs, so it is shown in their own list.

  A closed intake says so at the top, with the way to reopen it. Its enrol
  form and "Enrol again" buttons are not shown: the API would refuse them.
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
  const closed = isCohortClosed(cohort.status);
  const cohortFields = { cohortId: cohort.id, cohortName: cohort.name };

  const onCohort = cohort.enrolments.filter((enrolment) => enrolment.status !== "WITHDRAWN");
  const withdrawn = cohort.enrolments.filter((enrolment) => enrolment.status === "WITHDRAWN");
  const stillWorking = onCohort.filter((enrolment) => isOpen(enrolment)).length;
  const memberIds = new Set(members.map((member) => member.userId));

  // Everyone listed here already — withdrawn included, who have Enrol again.
  const listed = new Set(cohort.enrolments.map((enrolment) => enrolment.learner.email));
  const candidates = members
    .filter((member) => !listed.has(member.email))
    .map((member) => ({
      email: member.email,
      name: `${member.firstName} ${member.lastName}`.trim(),
      role: institutionContent.roles[member.role],
    }));

  return (
    <ActionOutcome>
      <div className="app-stack">
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={closed ? "neutral" : "success"}>
                {cohortsCopy.statuses[cohort.status]}
              </Badge>
              <ButtonLink
                href={`/institution/cohorts/${cohort.id}/edit`}
                icon="none"
                size="md"
                variant="secondary"
              >
                {copy.edit}
              </ButtonLink>
            </div>
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

        <ActionOutcomeMessage />

        {closed ? (
          <Panel description={copy.closed.description} title={copy.closed.title}>
            <ActionButton
              action={reopenCohort}
              busyLabel={copy.closed.busy}
              fields={cohortFields}
              label={copy.closed.reopen}
            />
          </Panel>
        ) : null}

        <Panel title={copy.learnersTitle}>
          {onCohort.length === 0 ? (
            <p className="type-body-sm text-farm-muted">
              {closed ? copy.learnersEmptyClosed : copy.learnersEmpty}
            </p>
          ) : (
            <ul className="grid gap-4">
              {onCohort.map((enrolment) => {
                const name = learnerName(enrolment);

                return (
                  <li key={enrolment.id} className={rowClass}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-farm-green-950">{name}</p>
                      <p className="mt-1 break-words type-caption text-farm-muted">
                        {enrolment.learner.email} · {copy.enrolmentStatuses[enrolment.status]}
                      </p>
                    </div>
                    <ProgressBar label={copy.progressLabel(name)} value={enrolment.progressPercent} />
                    {isOpen(enrolment) ? (
                      <ConfirmAction
                        action={withdrawLearner}
                        busyLabel={copy.withdraw.busy}
                        confirmLabel={copy.withdraw.confirm}
                        consequence={copy.withdraw.consequence(name, cohort.name)}
                        fields={{ cohortId: cohort.id, enrolmentId: enrolment.id, name }}
                        label={copy.withdraw.label}
                        target={name}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {withdrawn.length > 0 ? (
          <Panel description={copy.withdrawn.description} title={copy.withdrawn.title}>
            <ul className="grid gap-4">
              {withdrawn.map((enrolment) => {
                const name = learnerName(enrolment);
                const stillAMember = memberIds.has(enrolment.learner.userId);

                return (
                  <li key={enrolment.id} className={rowClass}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-farm-green-950">{name}</p>
                      <p className="mt-1 break-words type-caption text-farm-muted">
                        {enrolment.learner.email}
                        {enrolment.withdrawnAt
                          ? ` · ${copy.withdrawn.date(formatDay(enrolment.withdrawnAt))}`
                          : null}
                      </p>
                      {stillAMember ? null : (
                        <p className="mt-1 type-caption text-farm-muted">
                          {copy.withdrawn.notAMember}
                        </p>
                      )}
                    </div>
                    <ProgressBar label={copy.progressLabel(name)} value={enrolment.progressPercent} />
                    {!closed && stillAMember ? (
                      <ActionButton
                        action={enrolAgain}
                        busyLabel={copy.withdrawn.busy}
                        fields={{ cohortId: cohort.id, email: enrolment.learner.email, name }}
                        label={copy.withdrawn.enrolAgain}
                        target={name}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : null}

        {closed ? null : (
          <Panel description={copy.enrol.description} title={copy.enrol.title}>
            {candidates.length === 0 ? (
              <p className="type-body-sm text-farm-muted">
                {withdrawn.length > 0
                  ? copy.enrol.everyoneEnrolledOrWithdrawn
                  : copy.enrol.everyoneEnrolled}{" "}
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
        )}

        {closed ? null : (
          <Panel description={copy.close.description} title={copy.close.title}>
            <ConfirmAction
              action={closeCohort}
              busyLabel={copy.close.busy}
              confirmLabel={copy.close.confirm}
              consequence={copy.close.consequence(cohort.name, stillWorking)}
              fields={cohortFields}
              label={copy.close.label}
            />
          </Panel>
        )}
      </div>
    </ActionOutcome>
  );
}

/*
  A learner's row: who, how far, and what can be done. The last column is a
  fixed width so the progress bars line up whether or not a row has a button;
  an open confirmation takes the whole row beneath them.
*/
const rowClass =
  "grid gap-3 border-b border-farm-border pb-4 last:border-0 last:pb-0 " +
  "sm:grid-cols-[1fr_14rem] sm:items-center lg:grid-cols-[1fr_14rem_9.5rem]";

/** Still working through it: the places a withdrawal or a close concerns. */
function isOpen(enrolment: CohortEnrolment): boolean {
  return enrolment.status === "INVITED" || enrolment.status === "ACTIVE";
}

function learnerName(enrolment: CohortEnrolment): string {
  const { firstName, lastName, email } = enrolment.learner;

  return `${firstName} ${lastName}`.trim() || email;
}
