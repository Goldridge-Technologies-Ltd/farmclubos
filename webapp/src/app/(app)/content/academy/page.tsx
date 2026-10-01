import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@farmclub/design-system/Icon";
import { ContentStatus } from "@/components/authoring/ContentStatus";
import { PageHeader } from "@/components/layout/PageHeader";
import { authoringContent } from "@/content/authoring";
import { listAuthoringPathways } from "@/lib/api/authoring";

export const metadata: Metadata = { title: "Academy content" };

/** The pathways, each with how many modules it has and has published. */
export default async function AcademyContentPage() {
  const pathways = await listAuthoringPathways();
  const copy = authoringContent.pathways;

  return (
    <div className="app-stack">
      <PageHeader
        crumbs={[{ label: authoringContent.crumb }, { label: authoringContent.academyCrumb }]}
        description={copy.description}
        eyebrow={copy.eyebrow}
        heading={copy.heading}
      />

      <ul className="grid gap-3">
        {pathways.map((pathway) => (
          <li key={pathway.id}>
            <Link
              href={`/content/academy/pathways/${pathway.id}`}
              className="group flex items-start justify-between gap-4 rounded-panel border border-farm-border bg-white p-6 transition-colors hover:border-farm-border-strong"
            >
              <div className="min-w-0">
                <ContentStatus archivedAt={null} status={pathway.status} />
                <h2 className="mt-3 text-lg font-semibold text-farm-green-950">{pathway.title}</h2>
                <p className="mt-1 type-caption text-farm-muted">
                  {copy.modules(pathway.moduleCount, pathway.publishedModuleCount)}
                </p>
              </div>
              <Icon
                name="chevron-right"
                size={16}
                className="mt-1 shrink-0 text-farm-green-800 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
