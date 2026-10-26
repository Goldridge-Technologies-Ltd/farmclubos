import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { ProgressBar } from "@farmclub/design-system/ProgressBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { StartPathwayForm } from "@/components/learning/StartPathwayForm";
import { Panel } from "@/components/ui/Panel";
import { academy } from "@/content/academy";
import { getPathway, myJourney } from "@/lib/api/academy";
import { nextLesson } from "@/lib/journey";

type PageProps = { params: Promise<{ pathwaySlug: string }> };

/** `params` is a Promise in Next.js 16. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pathwaySlug } = await params;
  const pathway = await getPathway(pathwaySlug);

  return { title: pathway.title, description: pathway.summary };
}

/*
  One pathway, and the way into it: where the learner has got to and what is
  next, or — for anyone who has not started it — the way to start it on their
  own. A pathway with nothing published in it yet offers neither.
*/
export default async function PathwayPage({ params }: PageProps) {
  const { pathwaySlug } = await params;
  const [pathway, journeys] = await Promise.all([getPathway(pathwaySlug), myJourney()]);
  const journey = journeys.find((item) => item.pathway.slug === pathway.slug);
  const next = journey ? nextLesson(journey) : null;
  const start = academy.start;

  return (
    <div className="app-stack">
      <PageHeader
        actions={<Badge tone="green">{academy.levels[pathway.level]}</Badge>}
        crumbs={[{ href: "/academy", label: academy.crumb }, { label: pathway.title }]}
        description={pathway.summary}
        heading={pathway.title}
      />

      {pathway.modules.length === 0 ? null : journey ? (
        <Panel title={start.progressHeading}>
          <ProgressBar label={start.through} value={journey.progressPercent} />
          <p className="mt-4 type-body-sm text-farm-muted">
            {next ? start.next(next.title) : start.finished}
          </p>
          <ButtonLink className="mt-6" href={next?.href ?? "/my-journey"} size="md">
            {next ? start.continue : start.journey}
          </ButtonLink>
        </Panel>
      ) : (
        <Panel description={start.description} title={start.heading}>
          <StartPathwayForm next={`/academy/${pathway.slug}`} pathwaySlug={pathway.slug} />
        </Panel>
      )}

      {pathway.description ? (
        <Panel>
          <p className="type-body text-farm-charcoal">{pathway.description}</p>
        </Panel>
      ) : null}

      {pathway.modules.length === 0 ? (
        <EmptyState
          description={academy.empty.modules.description}
          icon="learn"
          title={academy.empty.modules.title}
        />
      ) : (
        <Panel
          description={academy.pathway.modulesDescription}
          title={academy.pathway.modulesHeading}
        >
          <ol className="grid gap-3">
            {pathway.modules.map((module) => (
              <li key={module.id}>
                <Link
                  href={`/academy/${pathway.slug}/modules/${module.slug}`}
                  className="group flex items-start gap-4 rounded-card border border-farm-border p-5 transition-colors hover:border-farm-border-strong hover:bg-farm-cream-50"
                >
                  {/*
                    The module's own position in the pathway, not a count of
                    anything: it is what the database says the order is.
                  */}
                  <span
                    aria-hidden="true"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-farm-green-50 text-sm font-semibold text-farm-green-900"
                  >
                    {module.sequence}
                  </span>

                  <span className="flex-1">
                    <span className="block text-base font-semibold text-farm-green-950">
                      {module.title}
                    </span>
                    {module.summary ? (
                      <span className="mt-1 block type-body-sm text-farm-muted">
                        {module.summary}
                      </span>
                    ) : null}
                    <span className="mt-2.5 block type-caption text-farm-muted">
                      {academy.counts.lessons(module.lessonCount)} ·{" "}
                      {academy.counts.assessments(module.assessmentCount)}
                    </span>
                  </span>

                  <Icon
                    name="chevron-right"
                    size={16}
                    className="mt-1.5 shrink-0 text-farm-muted transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
