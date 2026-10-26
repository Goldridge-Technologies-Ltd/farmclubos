import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { ProgressBar } from "@farmclub/design-system/ProgressBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { journeyScreen } from "@/content/app";
import { myJourney } from "@/lib/api/academy";
import { cohortLine } from "@/lib/journey";

export const metadata: Metadata = { title: "My Journey" };

/*
  What the learner has actually done.

  Every number here was counted by the API from rows that exist — lessons
  marked complete, out of the published lessons in the pathway. Someone not
  yet enrolled sees an empty state rather than a zeroed-out dashboard, because
  0% implies a pathway they have not started rather than one they do not have.
*/
export default async function MyJourneyPage() {
  const journeys = await myJourney();

  return (
    <div className="app-stack">
      <PageHeader
        description={journeyScreen.description}
        eyebrow={journeyScreen.eyebrow}
        heading={journeyScreen.heading}
      />

      {journeys.length === 0 ? (
        <EmptyState
          action={<ButtonLink href="/academy">{journeyScreen.notEnrolled.action}</ButtonLink>}
          description={journeyScreen.notEnrolled.description}
          icon="grow"
          title={journeyScreen.notEnrolled.title}
        />
      ) : (
        journeys.map((journey) => (
          <Panel key={journey.enrolmentId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="type-title text-farm-green-950">
                  <Link
                    className="transition-colors hover:text-farm-green-800"
                    href={`/academy/${journey.pathway.slug}`}
                  >
                    {journey.pathway.title}
                  </Link>
                </h2>
                <p className="mt-1.5 type-caption text-farm-muted">
                  {cohortLine(journey, journeyScreen)}
                </p>
              </div>
              <Badge tone={journey.status === "COMPLETED" ? "success" : "green"}>
                {journeyScreen.enrolmentStatuses[journey.status]}
              </Badge>
            </div>

            <ProgressBar
              className="mt-6"
              label={journeyScreen.through}
              value={journey.progressPercent}
            />

            <ol className="mt-7 grid gap-3">
              {journey.modules.map((pathwayModule) => (
                <li
                  key={pathwayModule.moduleId}
                  className="rounded-card border border-farm-border p-5"
                >
                  {/*
                    Stacked on a phone, side by side from sm. flex-wrap alone
                    put a short title's count beside it and a long one's below,
                    so neighbouring cards disagreed.
                  */}
                  <div className="grid gap-1 sm:flex sm:items-start sm:justify-between sm:gap-3">
                    <Link
                      className="text-base font-semibold text-farm-green-950 transition-colors hover:text-farm-green-800"
                      href={`/academy/${journey.pathway.slug}/modules/${pathwayModule.slug}`}
                    >
                      {pathwayModule.sequence}. {pathwayModule.title}
                    </Link>
                    <span className="inline-flex items-center gap-2 type-caption text-farm-muted">
                      {pathwayModule.status === "COMPLETED" ? (
                        <Icon
                          name="tick"
                          size={18}
                          className="text-farm-green-700"
                          title={journeyScreen.statuses.COMPLETED}
                        />
                      ) : null}
                      {journeyScreen.moduleProgress(
                        pathwayModule.lessonsCompleted,
                        pathwayModule.lessonCount,
                      )}
                    </span>
                  </div>

                  <ul className="mt-3 grid gap-1.5">
                    {pathwayModule.lessons.map((lesson) => (
                      <li
                        key={lesson.lessonId}
                        className="flex items-center gap-2 type-caption text-farm-muted"
                      >
                        <Icon
                          name={lesson.status === "COMPLETED" ? "tick" : "chevron-right"}
                          size={14}
                          className={
                            lesson.status === "COMPLETED"
                              ? "text-farm-green-700"
                              : "text-farm-muted"
                          }
                        />
                        <Link
                          className="transition-colors hover:text-farm-green-800"
                          href={`/academy/${journey.pathway.slug}/modules/${pathwayModule.slug}/lessons/${lesson.slug}`}
                        >
                          {lesson.title}
                        </Link>
                        <span className="sr-only">
                          {journeyScreen.statuses[lesson.status]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Panel>
        ))
      )}
    </div>
  );
}
