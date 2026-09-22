import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@farmclub/design-system/Badge";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { academy } from "@/content/academy";
import { listPathways } from "@/lib/api/academy";

export const metadata: Metadata = { title: "Academy" };

/** The catalogue: every published pathway, in the order it is meant to be taken. */
export default async function AcademyPage() {
  const pathways = await listPathways();

  return (
    <div className="app-stack">
      <PageHeader
        description={academy.description}
        eyebrow={academy.eyebrow}
        heading={academy.heading}
      />

      {pathways.length === 0 ? (
        <EmptyState
          description={academy.empty.pathways.description}
          icon="learn"
          title={academy.empty.pathways.title}
        />
      ) : (
        <ul className="grid gap-3">
          {pathways.map((pathway) => (
            <li key={pathway.id}>
              <Link
                href={`/academy/${pathway.slug}`}
                className="group flex h-full flex-col rounded-panel border border-farm-border bg-white p-6 transition-colors hover:border-farm-border-strong sm:p-7"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge tone="green">{academy.levels[pathway.level]}</Badge>
                  {/* A real row count, not an illustration. */}
                  <span className="type-caption text-farm-muted">
                    {academy.counts.modules(pathway.moduleCount)}
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-semibold text-farm-green-950">
                  {pathway.title}
                </h2>
                <p className="mt-2 type-body-sm text-farm-muted">{pathway.summary}</p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-farm-green-800">
                  Open pathway
                  <Icon
                    name="arrow-right"
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
