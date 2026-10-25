import type { Metadata } from "next";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { ContentRow } from "@/components/authoring/ContentRow";
import { ContentStatus } from "@/components/authoring/ContentStatus";
import { DetailsForm } from "@/components/authoring/DetailsForm";
import { MoveButtons } from "@/components/authoring/MoveButtons";
import { PathwayForm } from "@/components/authoring/PathwayForm";
import { PublishingPanels } from "@/components/authoring/PublishingPanels";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionOutcome, ActionOutcomeMessage } from "@/components/ui/ActionOutcome";
import { Panel } from "@/components/ui/Panel";
import { authoringContent } from "@/content/authoring";
import {
  archivePathway,
  createModule,
  moveModule,
  publishPathway,
  restoreModule,
  restorePathway,
  unpublishPathway,
  updatePathway,
} from "@/lib/actions/authoring";
import { getAuthoringPathway } from "@/lib/api/authoring";

type PageProps = { params: Promise<{ pathwayId: string }> };

export const metadata: Metadata = { title: "Pathway" };

/*
  One pathway: its modules in the order learners take them — drafts too — a
  way to add one, its own details, and publishing. Its modules come first,
  since they are what the content team comes here to work on. Archived
  modules are listed apart, with Restore.
*/
export default async function PathwayContentPage({ params }: PageProps) {
  const { pathwayId } = await params;
  const pathway = await getAuthoringPathway(pathwayId);
  const copy = authoringContent.pathway;
  const live = pathway.modules.filter((item) => !item.archivedAt);
  const archived = pathway.modules.filter((item) => item.archivedAt);
  const visible = pathway.status === "PUBLISHED" && !pathway.archivedAt;

  return (
    <ActionOutcome>
      <div className="app-stack">
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <ContentStatus archivedAt={pathway.archivedAt} status={pathway.status} />
              {visible ? (
                <ButtonLink href={`/academy/${pathway.slug}`} icon="none" size="md" variant="secondary">
                  {authoringContent.lesson.viewInAcademy}
                </ButtonLink>
              ) : null}
            </div>
          }
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

        {pathway.archivedAt ? null : (
          <Panel description={copy.add.description} title={copy.add.title}>
            <DetailsForm
              action={createModule}
              busyLabel={copy.add.busy}
              fields={{ pathwayId: pathway.id }}
              submitLabel={copy.add.submit}
            />
          </Panel>
        )}

        <Panel description={authoringContent.details.pathwayDescription} title={authoringContent.details.title}>
          <PathwayForm
            action={updatePathway}
            busyLabel={authoringContent.details.busy}
            fields={{ pathwayId: pathway.id }}
            saved={{
              title: pathway.title,
              summary: pathway.summary,
              description: pathway.description,
              level: pathway.level,
            }}
            submitLabel={authoringContent.details.submit}
          />
        </Panel>

        <PublishingPanels
          actions={{
            publish: publishPathway,
            unpublish: unpublishPathway,
            archive: archivePathway,
            restore: restorePathway,
          }}
          draftText={authoringContent.publishing.draftPathway}
          fields={{ pathwayId: pathway.id }}
          item={pathway}
          publishedText={authoringContent.publishing.publishedPathway}
        />

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
