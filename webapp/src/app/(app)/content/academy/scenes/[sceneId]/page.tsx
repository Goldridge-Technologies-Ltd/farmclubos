import type { Metadata } from "next";
import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { MediaUpload } from "@/components/authoring/MediaUpload";
import { SceneDetailsForm } from "@/components/authoring/SceneDetailsForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { VideoPlayer } from "@/components/learning/VideoPlayer";
import { Panel } from "@/components/ui/Panel";
import { authoringContent } from "@/content/authoring";
import { getAuthoringScene } from "@/lib/api/authoring";
import type { MediaPurpose } from "@/lib/api/contracts";

type PageProps = { params: Promise<{ sceneId: string }> };

/** Read here as well, so a scene that isn't there titles the tab as not found. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await getAuthoringScene((await params).sceneId);

  return { title: "Scene" };
}

const SLOTS: MediaPurpose[] = ["VIDEO", "CAPTIONS", "POSTER"];

/*
  One scene. A video scene: its three files, a preview as learners will see it,
  and its title and supporting lines. A notes scene: its title and notes.

  The header says whether learners could see it yet, and if not, what is
  still missing — the same rule the API uses to decide.
*/
export default async function SceneContentPage({ params }: PageProps) {
  const { sceneId } = await params;
  const scene = await getAuthoringScene(sceneId);
  const copy = authoringContent.scene;
  const lessonCopy = authoringContent.lesson;
  const lessonHref = `/content/academy/lessons/${scene.lesson.id}`;
  const files = { VIDEO: scene.video, CAPTIONS: scene.captions, POSTER: scene.poster };

  return (
    <div className="app-stack">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {scene.gaps.length === 0 ? (
              <Badge tone="success">{lessonCopy.ready}</Badge>
            ) : (
              <span className="type-caption text-farm-muted">
                {lessonCopy.needs(scene.gaps.map((gap) => lessonCopy.gapNames[gap]))}
              </span>
            )}
            <ButtonLink href={lessonHref} icon="none" size="md" variant="secondary">
              {copy.backToLesson}
            </ButtonLink>
          </div>
        }
        crumbs={[
          { label: authoringContent.crumb },
          { href: "/content/academy", label: authoringContent.academyCrumb },
          { href: `/content/academy/pathways/${scene.pathway.id}`, label: scene.pathway.title },
          { href: `/content/academy/modules/${scene.module.id}`, label: scene.module.title },
          { href: lessonHref, label: scene.lesson.title },
          { label: scene.title },
        ]}
        eyebrow={lessonCopy.kinds[scene.kind]}
        heading={scene.title}
      />

      {scene.kind === "VIDEO" ? (
        <>
          <Panel description={copy.files.description} title={copy.files.title}>
            <div className="grid gap-4">
              {SLOTS.map((purpose) => (
                <MediaUpload
                  key={purpose}
                  current={files[purpose]}
                  purpose={purpose}
                  sceneId={scene.id}
                />
              ))}
            </div>
          </Panel>

          <Panel description={copy.preview.description} title={copy.preview.title}>
            {scene.video ? (
              <VideoPlayer
                transcript={scene.transcript}
                video={{
                  url: scene.video.url,
                  contentType: scene.video.contentType,
                  captionsUrl: scene.captions?.url ?? null,
                  posterUrl: scene.poster?.url ?? null,
                }}
              />
            ) : (
              <p className="type-body-sm text-farm-muted">{copy.preview.waiting}</p>
            )}
          </Panel>
        </>
      ) : null}

      <Panel
        description={scene.kind === "VIDEO" ? copy.details.videoDescription : copy.details.notesDescription}
        title={copy.details.title}
      >
        <SceneDetailsForm
          kind={scene.kind}
          saved={{ title: scene.title, body: scene.body }}
          sceneId={scene.id}
        />
      </Panel>
    </div>
  );
}
