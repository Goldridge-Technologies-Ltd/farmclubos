import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { academy } from "@/content/academy";
import { getPathway } from "@/lib/api/academy";

type PageProps = { params: Promise<{ pathwaySlug: string }> };

/** `params` is a Promise in Next.js 16. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pathwaySlug } = await params;
  const pathway = await getPathway(pathwaySlug);

  return { title: pathway.title, description: pathway.summary };
}

export default async function PathwayPage({ params }: PageProps) {
  const { pathwaySlug } = await params;
  const pathway = await getPathway(pathwaySlug);

  return (
    <div className="app-stack">
      <PageHeader
        actions={<Badge tone="green">{academy.levels[pathway.level]}</Badge>}
        crumbs={[{ href: "/academy", label: academy.crumb }, { label: pathway.title }]}
        description={pathway.summary}
        heading={pathway.title}
      />

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
