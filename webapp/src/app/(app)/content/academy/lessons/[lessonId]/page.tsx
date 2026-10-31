import type { Metadata } from "next";
import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { Icon } from "@farmclub/design-system/Icon";
import { AddSceneForm } from "@/components/authoring/AddSceneForm";
import { ContentRow } from "@/components/authoring/ContentRow";
import { ContentStatus } from "@/components/authoring/ContentStatus";
import { DetailsForm } from "@/components/authoring/DetailsForm";
import { MoveButtons } from "@/components/authoring/MoveButtons";
import { PublishingPanels } from "@/components/authoring/PublishingPanels";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionOutcome, ActionOutcomeMessage } from "@/components/ui/ActionOutcome";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Panel } from "@/components/ui/Panel";
import { authoringContent } from "@/content/authoring";
import {
  archiveLesson,
  moveScene,
  publishLesson,
  removeScene,
  restoreLesson,
  unpublishLesson,
  updateLesson,
} from "@/lib/actions/authoring";
import { getAuthoringLesson } from "@/lib/api/authoring";

type PageProps = { params: Promise<{ lessonId: string }> };

/** Read here as well, so a lesson that isn't there titles the tab as not found. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await getAuthoringLesson((await params).lessonId);

  return { title: "Lesson" };
}

/*
  One lesson: its scenes in order, each saying whether it is ready or what it
  still needs, a preview of the whole lesson, a way to add a scene, its
  details, and publishing — which needs every scene ready, so what is missing
  is in plain view above it.
*/
export default async function LessonContentPage({ params }: PageProps) {
  const { lessonId } = await params;
  const lesson = await getAuthoringLesson(lessonId);
  const copy = authoringContent.lesson;
  const visible =
    lesson.status === "PUBLISHED" && !lesson.archivedAt && lesson.module.status === "PUBLISHED";

  return (
    <ActionOutcome>
      <div className="app-stack">
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <ContentStatus archivedAt={lesson.archivedAt} status={lesson.status} />
              {visible ? (
                <ButtonLink
                  href={`/academy/${lesson.pathway.slug}/modules/${lesson.module.slug}/lessons/${lesson.slug}`}
                  icon="none"
                  size="md"
                  variant="secondary"
                >
                  {copy.viewInAcademy}
                </ButtonLink>
              ) : null}
            </div>
          }
          crumbs={[
            { label: authoringContent.crumb },
            { href: "/content/academy", label: authoringContent.academyCrumb },
            { href: `/content/academy/pathways/${lesson.pathway.id}`, label: lesson.pathway.title },
            { href: `/content/academy/modules/${lesson.module.id}`, label: lesson.module.title },
            { label: lesson.title },
          ]}
          description={lesson.summary ?? undefined}
          eyebrow={lesson.module.title}
          heading={lesson.title}
        />

        <ActionOutcomeMessage />

        <Panel
          action={
            lesson.scenes.length > 0 ? (
              <ButtonLink
                href={`/content/academy/lessons/${lesson.id}/preview`}
                icon="none"
                size="md"
                variant="secondary"
              >
                {copy.preview}
              </ButtonLink>
            ) : undefined
          }
          description={copy.scenesDescription}
          title={copy.scenesTitle}
        >
          {lesson.scenes.length === 0 ? (
            <p className="type-body-sm text-farm-muted">{copy.empty}</p>
          ) : (
            <ol className="grid gap-4">
              {lesson.scenes.map((scene, index) => (
                <ContentRow
                  key={scene.id}
                  controls={
                    <div className="flex flex-wrap items-start gap-2">
                      <MoveButtons
                        action={moveScene}
                        fields={{ sceneId: scene.id }}
                        position={index + 1}
                        target={scene.title}
                        total={lesson.scenes.length}
                      />
                      <ConfirmAction
                        action={removeScene}
                        busyLabel={copy.remove.busy}
                        confirmLabel={copy.remove.confirm}
                        consequence={copy.remove.consequence(scene.title, scene.kind)}
                        fields={{ sceneId: scene.id, title: scene.title }}
                        label={copy.remove.label}
                        target={scene.title}
                      />
                    </div>
                  }
                  href={`/content/academy/scenes/${scene.id}`}
                  lead={
                    <span
                      aria-hidden="true"
                      className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-farm-green-50 text-sm font-semibold text-farm-green-900"
                    >
                      {index + 1}
                    </span>
                  }
                  meta={
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name={scene.kind === "VIDEO" ? "video" : "book"} size={16} />
                      {copy.kinds[scene.kind]}
                      {scene.gaps.length > 0
                        ? ` · ${copy.needs(scene.gaps.map((gap) => copy.gapNames[gap]))}`
                        : null}
                    </span>
                  }
                  status={scene.gaps.length === 0 ? <Badge tone="success">{copy.ready}</Badge> : undefined}
                  title={scene.title}
                />
              ))}
            </ol>
          )}
        </Panel>

        {lesson.archivedAt ? null : (
          <Panel description={copy.add.description} title={copy.add.title}>
            <AddSceneForm lessonId={lesson.id} />
          </Panel>
        )}

        <Panel description={authoringContent.details.lessonDescription} title={authoringContent.details.title}>
          <DetailsForm
            action={updateLesson}
            busyLabel={authoringContent.details.busy}
            fields={{ lessonId: lesson.id }}
            saved={{ title: lesson.title, summary: lesson.summary }}
            submitLabel={authoringContent.details.submit}
          />
        </Panel>

        <PublishingPanels
          actions={{
            publish: publishLesson,
            unpublish: unpublishLesson,
            archive: archiveLesson,
            restore: restoreLesson,
          }}
          draftText={authoringContent.publishing.draftLesson}
          fields={{ lessonId: lesson.id }}
          item={lesson}
          publishedText={authoringContent.publishing.publishedLesson}
        />
      </div>
    </ActionOutcome>
  );
}
