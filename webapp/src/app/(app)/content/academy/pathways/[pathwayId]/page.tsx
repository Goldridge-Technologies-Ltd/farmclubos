import type { Metadata } from "next";
import { ContentRow } from "@/components/authoring/ContentRow";
import { ContentStatus } from "@/components/authoring/ContentStatus";
import { DetailsForm } from "@/components/authoring/DetailsForm";
import { MoveButtons } from "@/components/authoring/MoveButtons";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionOutcome, ActionOutcomeMessage } from "@/components/ui/ActionOutcome";
import { Panel } from "@/components/ui/Panel";
import { authoringContent } from "@/content/authoring";
import { createModule, moveModule, restoreModule } from "@/lib/actions/authoring";
import { getAuthoringPathway } from "@/lib/api/authoring";

type PageProps = { params: Promise<{ pathwayId: string }> };

export const metadata: Metadata = { title: "Pathway" };

/*
  A pathway's modules, in the order learners take them — drafts too — with a
  way to add one. Archived modules are listed apart, with Restore.
*/
export default async function PathwayContentPage({ params }: PageProps) {
  const { pathwayId } = await params;
  const pathway = await getAuthoringPathway(pathwayId);
  const copy = authoringContent.pathway;
  const live = pathway.modules.filter((item) => !item.archivedAt);
  const archived = pathway.modules.filter((item) => item.archivedAt);

  return (
    <ActionOutcome>
      <div className="app-stack">
        <PageHeader
          actions={<ContentStatus archivedAt={null} status={pathway.status} />}
          crumbs={[
            { label: authoringContent.crumb },
            { href: "/content/academy", label: authoringContent.academyCrumb },
            { label: pathway.title },
          ]}
          description={pathway.summary}
          eyebrow={authoringContent.academyCrumb}
          heading={pathway.title}
        />

        <ActionOutcomeMessage />

        <Panel description={copy.modulesDescription} title={copy.modulesTitle}>
          {live.length === 0 ? (
            <p className="type-body-sm text-farm-muted">{copy.empty}</p>
          ) : (
            <ol className="grid gap-4">
              {live.map((item, index) => (
                <ContentRow
                  key={item.id}
                  controls={
                    <MoveButtons
                      action={moveModule}
                      fields={{ moduleId: item.id }}
                      position={index + 1}
                      target={item.title}
                      total={live.length}
                    />
                  }
                  href={`/content/academy/modules/${item.id}`}
                  meta={copy.lessons(item.lessonCount, item.publishedLessonCount)}
                  status={<ContentStatus archivedAt={null} status={item.status} />}
                  summary={item.summary}
                  title={item.title}
                />
              ))}
            </ol>
          )}
        </Panel>

        <Panel description={copy.add.description} title={copy.add.title}>
          <DetailsForm
            action={createModule}
            busyLabel={copy.add.busy}
            fields={{ pathwayId: pathway.id }}
            submitLabel={copy.add.submit}
          />
        </Panel>

        {archived.length > 0 ? (
          <Panel description={copy.archivedDescription} title={copy.archivedTitle}>
            <ul className="grid gap-4">
              {archived.map((item) => (
                <ContentRow
                  key={item.id}
                  controls={
                    <ActionButton
                      action={restoreModule}
                      busyLabel={authoringContent.archive.restoring}
                      fields={{ moduleId: item.id, title: item.title }}
                      label={authoringContent.archive.restore}
                      target={item.title}
                    />
                  }
                  href={`/content/academy/modules/${item.id}`}
                  meta={copy.lessons(item.lessonCount, item.publishedLessonCount)}
                  status={<ContentStatus archivedAt={item.archivedAt} status={item.status} />}
                  title={item.title}
                />
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </ActionOutcome>
  );
}
