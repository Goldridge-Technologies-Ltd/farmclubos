import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { Icon } from "@farmclub/design-system/Icon";
import { Notice } from "@farmclub/design-system/Notice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { academy } from "@/content/academy";
import { getLesson } from "@/lib/api/academy";

type PageProps = {
  params: Promise<{ pathwaySlug: string; moduleSlug: string; lessonSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pathwaySlug, moduleSlug, lessonSlug } = await params;
  const lesson = await getLesson(pathwaySlug, moduleSlug, lessonSlug);

  return { title: lesson.title };
}

export default async function LessonPage({ params }: PageProps) {
  const { pathwaySlug, moduleSlug, lessonSlug } = await params;
  const lesson = await getLesson(pathwaySlug, moduleSlug, lessonSlug);

  const moduleHref = `/academy/${pathwaySlug}/modules/${moduleSlug}`;
  const lessonHref = (slug: string) => `${moduleHref}/lessons/${slug}`;

  return (
    <div className="app-stack">
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

      <Panel>
        {lesson.body ? (
          /*
            Plain text from the API, rendered as paragraphs. It is deliberately
            not treated as HTML or Markdown: rendering authored content as
            markup is an injection surface, and the authoring format is not
            settled yet.
          */
          <div className="grid gap-4">
            {lesson.body
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index} className="type-body text-farm-charcoal">
                  {paragraph}
                </p>
              ))}
          </div>
        ) : (
          <Notice
            title={
              lesson.authoringStatus === "IN_REVIEW"
                ? academy.lesson.inReview.title
                : academy.lesson.beingAuthored.title
            }
            tone="info"
          >
            {lesson.authoringStatus === "IN_REVIEW"
              ? academy.lesson.inReview.description
              : academy.lesson.beingAuthored.description}
          </Notice>
        )}
      </Panel>

      <nav
        aria-label="Lessons in this module"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        {lesson.previous ? (
          <Link
            href={lessonHref(lesson.previous.slug)}
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
            href={lessonHref(lesson.next.slug)}
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
    </div>
  );
}
