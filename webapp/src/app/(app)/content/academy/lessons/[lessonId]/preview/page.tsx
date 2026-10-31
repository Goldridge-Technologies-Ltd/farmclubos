import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { Notice } from "@farmclub/design-system/Notice";
import { ContentStatus } from "@/components/authoring/ContentStatus";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotesView } from "@/components/learning/NotesView";
import { SceneHeading } from "@/components/learning/SceneHeading";
import { SceneOutline } from "@/components/learning/SceneOutline";
import { VideoPlayer } from "@/components/learning/VideoPlayer";
import { Panel } from "@/components/ui/Panel";
import { academy } from "@/content/academy";
import { authoringContent } from "@/content/authoring";
import { getLessonPreview } from "@/lib/api/authoring";
import type { PreviewScene } from "@/lib/api/contracts";
import { sceneToShow } from "@/lib/scenes";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ scene?: string }>;
};

export const metadata: Metadata = { title: "Lesson preview" };

/** A preview records nothing, so no scene is ever ticked off. */
const NOTHING_DONE: ReadonlySet<string> = new Set();

/*
  A whole lesson as learners will see it, one scene at a time, for the
  content team to go through before publishing: the learner's own player,
  notes and outline, with nothing recorded.

  Unlike the learner's lesson it has every scene. One learners would not see
  yet says what it still needs, and a video plays before its still image is
  added. Back and Continue move between scenes; the last leads back to the
  lesson's page.
*/
export default async function LessonPreviewPage({ params, searchParams }: PageProps) {
  const { lessonId } = await params;
  const query = await searchParams;
  const lesson = await getLessonPreview(lessonId);
  const copy = authoringContent.preview;
  const lessonHref = `/content/academy/lessons/${lesson.id}`;
  const previewHref = `${lessonHref}/preview`;
  const scenes = lesson.scenes;

  const header = (
    <PageHeader
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <ContentStatus archivedAt={lesson.archivedAt} status={lesson.status} />
          <ButtonLink href={lessonHref} icon="none" size="md" variant="secondary">
            {authoringContent.scene.backToLesson}
          </ButtonLink>
        </div>
      }
      crumbs={[
        { label: authoringContent.crumb },
        { href: "/content/academy", label: authoringContent.academyCrumb },
        { href: `/content/academy/pathways/${lesson.pathway.id}`, label: lesson.pathway.title },
        { href: `/content/academy/modules/${lesson.module.id}`, label: lesson.module.title },
        { href: lessonHref, label: lesson.title },
        { label: copy.crumb },
      ]}
      description={lesson.summary ?? undefined}
      eyebrow={copy.eyebrow}
      heading={lesson.title}
    />
  );

  if (scenes.length === 0) {
    return (
      <div className="app-stack">
        {header}
        <Panel>
          <p className="type-body-sm text-farm-muted">{copy.empty}</p>
        </Panel>
      </div>
    );
  }

  const index = sceneToShow(query.scene, scenes, NOTHING_DONE, false);

  return (
    <div className="app-stack">
      {header}

      <Notice tone="info">{copy.about}</Notice>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <Scene
          index={index}
          lessonHref={lessonHref}
          moveFocus={query.scene !== undefined}
          previewHref={previewHref}
          scenes={scenes}
        />
        <SceneOutline current={index} done={NOTHING_DONE} lessonHref={previewHref} scenes={scenes} />
      </div>
    </div>
  );
}

/** The scene on screen, what it still needs if anything, and Back and Continue. */
function Scene({
  scenes,
  index,
  lessonHref,
  previewHref,
  moveFocus,
}: {
  scenes: PreviewScene[];
  index: number;
  lessonHref: string;
  previewHref: string;
  /** Whether the address named the scene, as every move between scenes does. */
  moveFocus: boolean;
}) {
  const sceneCopy = academy.scene;
  const copy = authoringContent.preview;
  const gapNames = authoringContent.lesson.gapNames;
  const scene = scenes[index];
  const last = index === scenes.length - 1;

  return (
    <div className="grid gap-6 rounded-panel border border-farm-border bg-white p-6 sm:p-7">
      <div>
        <p className="type-overline text-farm-green-700">
          {sceneCopy.position(index + 1, scenes.length)}
        </p>
        <SceneHeading moveFocus={moveFocus} sceneId={scene.id}>
          {scene.title}
        </SceneHeading>
      </div>

      {scene.gaps.length > 0 ? (
        <Notice title={copy.notReady.title} tone="info">
          {copy.notReady.description(scene.gaps.map((gap) => gapNames[gap]))}{" "}
          <Link
            className="font-semibold text-farm-green-800 underline underline-offset-2 transition-colors hover:text-farm-green-950"
            href={`/content/academy/scenes/${scene.id}`}
          >
            {copy.notReady.edit}
          </Link>
        </Notice>
      ) : null}

      {scene.video ? <VideoPlayer transcript={scene.transcript} video={scene.video} /> : null}
      {scene.body ? <NotesView source={scene.body} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-farm-border pt-5">
        {index > 0 ? (
          <ButtonLink href={`${previewHref}?scene=${index}`} icon="none" size="md" variant="secondary">
            {sceneCopy.back}
          </ButtonLink>
        ) : (
          <span />
        )}
        <ButtonLink href={last ? lessonHref : `${previewHref}?scene=${index + 2}`} size="md">
          {last ? copy.finish : sceneCopy.continue}
        </ButtonLink>
      </div>
    </div>
  );
}
