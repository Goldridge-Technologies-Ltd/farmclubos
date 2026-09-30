import type { Metadata } from "next";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { ContentRow } from "@/components/authoring/ContentRow";
import { ContentStatus } from "@/components/authoring/ContentStatus";
import { DetailsForm } from "@/components/authoring/DetailsForm";
import { MoveButtons } from "@/components/authoring/MoveButtons";
import { PublishingPanels } from "@/components/authoring/PublishingPanels";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionOutcome, ActionOutcomeMessage } from "@/components/ui/ActionOutcome";
import { Panel } from "@/components/ui/Panel";
import { authoringContent } from "@/content/authoring";
import {
  archiveModule,
  createLesson,
  moveLesson,
  publishModule,
  restoreLesson,
  restoreModule,
  unpublishModule,
  updateModule,
} from "@/lib/actions/authoring";
import { getAuthoringModule } from "@/lib/api/authoring";

type PageProps = { params: Promise<{ moduleId: string }> };

export const metadata: Metadata = { title: "Module" };

/*
  One module: its lessons in order, a way to add one, its own details, and
  publishing. Its lessons are listed before its details because that is what
  the content team comes here to work on.
*/
export default async function ModuleContentPage({ params }: PageProps) {
  const { moduleId } = await params;
  const item = await getAuthoringModule(moduleId);
  const copy = authoringContent.module;
  const live = item.lessons.filter((lesson) => !lesson.archivedAt);
  const archived = item.lessons.filter((lesson) => lesson.archivedAt);
  const visible = item.status === "PUBLISHED" && !item.archivedAt;

  return (
    <ActionOutcome>
      <div className="app-stack">
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <ContentStatus archivedAt={item.archivedAt} status={item.status} />
              {visible ? (
                <ButtonLink
                  href={`/academy/${item.pathway.slug}/modules/${item.slug}`}
                  icon="none"
                  size="md"
                  variant="secondary"
                >
                  {authoringContent.lesson.viewInAcademy}
                </ButtonLink>
              ) : null}
            </div>
          }
          crumbs={[
            { label: authoringContent.crumb },
            { href: "/content/academy", label: authoringContent.academyCrumb },
            { href: `/content/academy/pathways/${item.pathway.id}`, label: item.pathway.title },
            { label: item.title },
          ]}
          description={item.summary ?? undefined}
          eyebrow={item.pathway.title}
          heading={item.title}
        />

        <ActionOutcomeMessage />

        <Panel description={copy.lessonsDescription} title={copy.lessonsTitle}>
          {live.length === 0 ? (
            <p className="type-body-sm text-farm-muted">{copy.empty}</p>
          ) : (
            <ol className="grid gap-4">
              {live.map((lesson, index) => (
                <ContentRow
                  key={lesson.id}
                  controls={
                    <MoveButtons
                      action={moveLesson}
                      fields={{ lessonId: lesson.id }}
                      position={index + 1}
                      target={lesson.title}
                      total={live.length}
                    />
                  }
                  href={`/content/academy/lessons/${lesson.id}`}
                  meta={copy.scenes(lesson.sceneCount, lesson.readySceneCount)}
                  status={<ContentStatus archivedAt={null} status={lesson.status} />}
                  summary={lesson.summary}
                  title={lesson.title}
                />
              ))}
            </ol>
          )}
        </Panel>

        {item.archivedAt ? null : (
          <Panel description={copy.add.description} title={copy.add.title}>
            <DetailsForm
              action={createLesson}
              busyLabel={copy.add.busy}
              fields={{ moduleId: item.id }}
              submitLabel={copy.add.submit}
            />
          </Panel>
        )}

        <Panel description={authoringContent.details.moduleDescription} title={authoringContent.details.title}>
          <DetailsForm
            action={updateModule}
            busyLabel={authoringContent.details.busy}
            fields={{ moduleId: item.id }}
            saved={{ title: item.title, summary: item.summary }}
            submitLabel={authoringContent.details.submit}
          />
        </Panel>

        <PublishingPanels
          actions={{
            publish: publishModule,
            unpublish: unpublishModule,
            archive: archiveModule,
            restore: restoreModule,
          }}
          draftText={authoringContent.publishing.draftModule}
          fields={{ moduleId: item.id }}
          item={item}
          publishedText={authoringContent.publishing.publishedModule}
        />

        {archived.length > 0 ? (
          <Panel description={copy.archivedDescription} title={copy.archivedTitle}>
            <ul className="grid gap-4">
              {archived.map((lesson) => (
                <ContentRow
                  key={lesson.id}
                  controls={
                    <ActionButton
                      action={restoreLesson}
                      busyLabel={authoringContent.archive.restoring}
                      fields={{ lessonId: lesson.id, title: lesson.title }}
                      label={authoringContent.archive.restore}
                      target={lesson.title}
                    />
                  }
                  href={`/content/academy/lessons/${lesson.id}`}
                  meta={copy.scenes(lesson.sceneCount, lesson.readySceneCount)}
                  status={<ContentStatus archivedAt={lesson.archivedAt} status={lesson.status} />}
                  title={lesson.title}
                />
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </ActionOutcome>
  );
}
