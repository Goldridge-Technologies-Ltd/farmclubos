import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { Icon } from "@farmclub/design-system/Icon";
import { Notice } from "@farmclub/design-system/Notice";
import { ProgressBar } from "@farmclub/design-system/ProgressBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContinueForm } from "@/components/learning/ContinueForm";
import { MarkCompleteForm } from "@/components/learning/MarkCompleteForm";
import { NotesView } from "@/components/learning/NotesView";
import { SceneHeading } from "@/components/learning/SceneHeading";
import { SceneOutline } from "@/components/learning/SceneOutline";
import { StartPathwayForm } from "@/components/learning/StartPathwayForm";
import { VideoPlayer } from "@/components/learning/VideoPlayer";
import { FocusOnMount } from "@/components/ui/FocusOnMount";
import { Panel } from "@/components/ui/Panel";
import { academy } from "@/content/academy";
import { getLesson, getLessonStanding } from "@/lib/api/academy";
import type { LessonDetail } from "@/lib/api/contracts";
import { sceneToShow } from "@/lib/scenes";

type PageProps = {
  params: Promise<{ pathwaySlug: string; moduleSlug: string; lessonSlug: string }>;
  searchParams: Promise<{ scene?: string; completed?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pathwaySlug, moduleSlug, lessonSlug } = await params;
  const lesson = await getLesson(pathwaySlug, moduleSlug, lessonSlug);

  return { title: lesson.title };
}

/*
  A lesson, one scene at a time: a video, with captions and a transcript when
  it has them, or notes to read. Back and Continue move between scenes; for an
  enrolled learner Continue records the scene as finished, and finishing the
  last completes the lesson. Progress counts scenes, never time watched.

  With no scene in the address, an enrolled learner resumes where they stopped.
  A lesson with no scenes yet — an outline still being written — keeps the
  plain "Mark as complete".
*/
export default async function LessonPage({ params, searchParams }: PageProps) {
  const { pathwaySlug, moduleSlug, lessonSlug } = await params;
  const query = await searchParams;
  const lesson = await getLesson(pathwaySlug, moduleSlug, lessonSlug);
  const standing = await getLessonStanding(lesson.id);

  const moduleHref = `/academy/${pathwaySlug}/modules/${moduleSlug}`;
  const lessonHrefFor = (slug: string) => `${moduleHref}/lessons/${slug}`;
  const lessonHref = lessonHrefFor(lesson.slug);

  const header = (
    <PageHeader
      crumbs={[
        { href: "/academy", label: academy.crumb },
        { href: `/academy/${pathwaySlug}`, label: lesson.pathway.title },
        { href: moduleHref, label: lesson.module.title },
        { label: lesson.title },
      ]}
      description={lesson.summary ?? undefined}
      eyebrow={academy.lessonKinds[lesson.kind]}
      heading={lesson.title}
    />
  );

  const lessonNavigation = (
    <LessonNavigation lesson={lesson} lessonHrefFor={lessonHrefFor} moduleHref={moduleHref} />
  );

  if (lesson.scenes.length === 0) {
    return (
      <div className="app-stack">
        {header}
        <OutlineLesson lesson={lesson} />
        <Panel>
          {standing.enrolled ? (
            <MarkCompleteForm
              alreadyComplete={standing.status === "COMPLETED"}
              lessonId={lesson.id}
            />
          ) : (
            <div className="grid gap-4">
              <Notice tone="info">{academy.lesson.notEnrolled}</Notice>
              <StartPathwayForm next={lessonHref} pathwaySlug={pathwaySlug} />
            </div>
          )}
        </Panel>
        {lessonNavigation}
      </div>
    );
  }

  const copy = academy.scene;
  const scenes = lesson.scenes;
  // Only scenes still in the lesson count: one removed since is no longer there to finish.
  const done = new Set(
    standing.completedSceneIds.filter((id) => scenes.some((scene) => scene.id === id)),
  );
  // The end is shown only to someone who has really finished — or who is
  // not enrolled, for whom it records nothing.
  const atEnd =
    query.completed === "1" && (!standing.enrolled || standing.status === "COMPLETED");
  const index = sceneToShow(query.scene, scenes, done, standing.enrolled);

  return (
    <div className="app-stack">
      {header}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        {atEnd ? (
          <FocusOnMount>
            <Panel
              description={standing.enrolled ? copy.complete.description : copy.end.description}
              title={standing.enrolled ? copy.complete.title : copy.end.title}
            >
              <div className="flex flex-wrap gap-3">
                {lesson.next ? (
                  <ButtonLink href={lessonHrefFor(lesson.next.slug)} size="md">
                    {copy.nextLesson(lesson.next.title)}
                  </ButtonLink>
                ) : (
                  <ButtonLink href={moduleHref} size="md">
                    {academy.lesson.backToModule}
                  </ButtonLink>
                )}
                <ButtonLink href={`${lessonHref}?scene=1`} icon="none" size="md" variant="secondary">
                  {copy.review}
                </ButtonLink>
              </div>
              {/* Started now, the lesson begins again so its scenes are recorded. */}
              {standing.enrolled ? null : (
                <div className="mt-6 border-t border-farm-border pt-5">
                  <StartPathwayForm next={`${lessonHref}?scene=1`} pathwaySlug={pathwaySlug} />
                </div>
              )}
            </Panel>
          </FocusOnMount>
        ) : (
          <Scene
            done={done}
            enrolled={standing.enrolled}
            index={index}
            lessonHref={lessonHref}
            moveFocus={query.scene !== undefined}
            pathwaySlug={pathwaySlug}
            scenes={scenes}
          />
        )}

        <SceneOutline
          current={atEnd ? null : index}
          done={done}
          lessonHref={lessonHref}
          scenes={scenes}
        />
      </div>

      {/* At the end the panel already leads on, to the next lesson or the module. */}
      {atEnd ? null : lessonNavigation}
    </div>
  );
}

/** The scene on screen, with Back and Continue. */
function Scene({
  scenes,
  index,
  done,
  enrolled,
  lessonHref,
  moveFocus,
  pathwaySlug,
}: {
  scenes: LessonDetail["scenes"];
  index: number;
  done: ReadonlySet<string>;
  enrolled: boolean;
  lessonHref: string;
  /** For starting the pathway, which is what saves a place in its lessons. */
  pathwaySlug: string;
  /** Whether the learner moved here from another scene, rather than opening the lesson. */
  moveFocus: boolean;
}) {
  const copy = academy.scene;
  const scene = scenes[index];
  const last = index === scenes.length - 1;
  const next = last ? `${lessonHref}?completed=1` : `${lessonHref}?scene=${index + 2}`;
  const label = last ? copy.finish : copy.continue;

  return (
    <div className="grid gap-6 rounded-panel border border-farm-border bg-white p-6 sm:p-7">
      <div>
        <p className="type-overline text-farm-green-700">{copy.position(index + 1, scenes.length)}</p>
        <SceneHeading moveFocus={moveFocus} sceneId={scene.id}>
          {scene.title}
        </SceneHeading>
      </div>

      {enrolled ? (
        <ProgressBar label={copy.through} value={Math.round((done.size / scenes.length) * 100)} />
      ) : (
        <div className="grid gap-4">
          <Notice tone="info">{copy.notEnrolled}</Notice>
          <StartPathwayForm next={`${lessonHref}?scene=${index + 1}`} pathwaySlug={pathwaySlug} />
        </div>
      )}

      {scene.video ? <VideoPlayer transcript={scene.transcript} video={scene.video} /> : null}
      {scene.body ? <NotesView source={scene.body} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-farm-border pt-5">
        {index > 0 ? (
          <ButtonLink href={`${lessonHref}?scene=${index}`} icon="none" size="md" variant="secondary">
            {copy.back}
          </ButtonLink>
        ) : (
          <span />
        )}
        {enrolled ? (
          <ContinueForm label={label} next={next} sceneId={scene.id} />
        ) : (
          <ButtonLink href={next} size="md">
            {label}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

/** A lesson with no scenes yet: a plain word that it is being written. */
function OutlineLesson({ lesson }: { lesson: LessonDetail }) {
  const copy =
    lesson.authoringStatus === "IN_REVIEW" ? academy.lesson.inReview : academy.lesson.beingAuthored;

  return (
    <Panel>
      <Notice title={copy.title} tone="info">
        {copy.description}
      </Notice>
    </Panel>
  );
}

/** The lessons either side, so a module reads as a sequence. */
function LessonNavigation({
  lesson,
  lessonHrefFor,
  moduleHref,
}: {
  lesson: LessonDetail;
  lessonHrefFor: (slug: string) => string;
  moduleHref: string;
}) {
  return (
    <nav
      aria-label={academy.lesson.navigation}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      {lesson.previous ? (
        <Link
          href={lessonHrefFor(lesson.previous.slug)}
          className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
        >
          <Icon name="arrow-left" size={16} className="shrink-0" />
          <span className="truncate">{lesson.previous.title}</span>
        </Link>
      ) : (
        <span />
      )}

      {lesson.next ? (
        <Link
          href={lessonHrefFor(lesson.next.slug)}
          className="group inline-flex max-w-full items-center gap-2 text-sm font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
        >
          <span className="truncate">{lesson.next.title}</span>
          <Icon
            name="arrow-right"
            size={16}
            className="shrink-0 transition-transform group-hover:translate-x-1"
          />
        </Link>
      ) : (
        <ButtonLink href={moduleHref} icon="none" size="md" variant="secondary">
          {academy.lesson.backToModule}
        </ButtonLink>
      )}
    </nav>
  );
}
