import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { academy } from "@/content/academy";
import { getModule } from "@/lib/api/academy";

type PageProps = { params: Promise<{ pathwaySlug: string; moduleSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pathwaySlug, moduleSlug } = await params;
  const pathwayModule = await getModule(pathwaySlug, moduleSlug);

  return { title: pathwayModule.title };
}

export default async function ModulePage({ params }: PageProps) {
  const { pathwaySlug, moduleSlug } = await params;
  const pathwayModule = await getModule(pathwaySlug, moduleSlug);
  const lessonHref = (lessonSlug: string) =>
    `/academy/${pathwaySlug}/modules/${moduleSlug}/lessons/${lessonSlug}`;

  return (
    <div className="app-stack">
      <PageHeader
        crumbs={[
          { href: "/academy", label: academy.crumb },
          { href: `/academy/${pathwaySlug}`, label: pathwayModule.pathway.title },
          { label: pathwayModule.title },
        ]}
        description={pathwayModule.summary ?? undefined}
        heading={pathwayModule.title}
      />

      {pathwayModule.lessons.length === 0 ? (
        <EmptyState
          description={academy.empty.lessons.description}
          icon="learn"
          title={academy.empty.lessons.title}
        />
      ) : (
        <Panel title={academy.module.lessonsHeading}>
          <ol className="grid gap-3">
            {pathwayModule.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={lessonHref(lesson.slug)}
                  className="group flex items-start gap-4 rounded-card border border-farm-border p-5 transition-colors hover:border-farm-border-strong hover:bg-farm-cream-50"
                >
                  <Icon
                    name="book"
                    size={20}
                    className="mt-0.5 shrink-0 text-farm-green-800"
                  />
                  <span className="flex-1">
                    <span className="block text-base font-semibold text-farm-green-950">
                      {lesson.title}
                    </span>
                    {lesson.summary ? (
                      <span className="mt-1 block type-body-sm text-farm-muted">
                        {lesson.summary}
                      </span>
                    ) : null}
                    <span className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="type-caption text-farm-muted">
                        {academy.lessonKinds[lesson.kind]}
                      </span>
                      {/*
                        Said plainly rather than hidden: the outline exists and
                        the lesson is not written. `durationMinutes` is null
                        here and is never filled in to look complete.
                      */}
                      {lesson.authoringStatus !== "AUTHORED" ? (
                        <Badge tone="warning">{academy.assessment.beingAuthored}</Badge>
                      ) : null}
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

      <Panel
        description={academy.module.assessmentsDescription}
        title={academy.module.assessmentsHeading}
      >
        {pathwayModule.assessments.length === 0 ? (
          <p className="type-body-sm text-farm-muted">{academy.module.noAssessments}</p>
        ) : (
          <ul className="grid gap-3">
            {pathwayModule.assessments.map((assessment) => (
              <li
                key={assessment.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-farm-border p-5"
              >
                <div>
                  <p className="text-base font-semibold text-farm-green-950">
                    {assessment.title}
                  </p>
                  <p className="mt-1.5 type-caption text-farm-muted">
                    {academy.assessmentKinds[assessment.kind]} ·{" "}
                    {academy.counts.questions(assessment.questionCount)} ·{" "}
                    {academy.assessment.passMark(assessment.passMarkPercent)}
                  </p>
                </div>
                {assessment.authoringStatus !== "AUTHORED" ? (
                  <Badge tone="warning">{academy.assessment.beingAuthored}</Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
