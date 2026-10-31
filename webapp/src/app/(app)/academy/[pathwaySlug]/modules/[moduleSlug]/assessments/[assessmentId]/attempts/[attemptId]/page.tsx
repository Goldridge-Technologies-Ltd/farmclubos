import type { Metadata } from "next";
import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { Notice } from "@farmclub/design-system/Notice";
import { ProgressBar } from "@farmclub/design-system/ProgressBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { AttemptForm } from "@/components/learning/AttemptForm";
import { FocusOnMount } from "@/components/ui/FocusOnMount";
import { StartAttemptForm } from "@/components/learning/StartAttemptForm";
import { academy } from "@/content/academy";
import { getAssessment, getAttempt } from "@/lib/api/academy";

type PageProps = {
  params: Promise<{
    pathwaySlug: string;
    moduleSlug: string;
    assessmentId: string;
    attemptId: string;
  }>;
  /** `submitted` is set only on the redirect straight after submitting. */
  searchParams: Promise<{ submitted?: string }>;
};

/** Read here as well, so an assessment or attempt that isn't there titles the tab as not found. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { assessmentId, attemptId } = await params;
  await Promise.all([getAssessment(assessmentId), getAttempt(attemptId)]);

  return { title: "Assessment" };
}

/*
  One attempt: the questions while it is in progress, the result once it has
  been submitted. The same route serves both, because after submitting there
  is nothing to navigate to — the attempt is the thing being looked at.
*/
export default async function AttemptPage({ params, searchParams }: PageProps) {
  const { pathwaySlug, moduleSlug, assessmentId, attemptId } = await params;
  const { submitted } = await searchParams;
  const [assessment, attempt] = await Promise.all([
    getAssessment(assessmentId),
    getAttempt(attemptId),
  ]);

  const moduleHref = `/academy/${pathwaySlug}/modules/${moduleSlug}`;
  const crumbs = [
    { href: "/academy", label: academy.crumb },
    { href: `/academy/${pathwaySlug}`, label: assessment.pathway.title },
    { href: moduleHref, label: assessment.module.title },
    { label: assessment.title },
  ];

  if (attempt.status === "IN_PROGRESS") {
    return (
      <div className="app-stack">
        <PageHeader
          crumbs={crumbs}
          description={assessment.instructions ?? undefined}
          eyebrow={academy.assessmentKinds[assessment.kind]}
          heading={assessment.title}
        />
        <AttemptForm assessment={assessment} attempt={attempt} />
      </div>
    );
  }

  const score = attempt.scorePercent ?? 0;
  const resultPanel = (
    <Panel title={academy.assessment.result.heading}>
      {/* A real score from a graded attempt — the only kind of figure allowed. */}
      <ProgressBar label={academy.assessment.result.heading} value={score} />
      <p className="mt-4 type-body-sm text-farm-muted">
        {academy.assessment.result.againstPassMark(assessment.passMarkPercent)}
      </p>
      {attempt.questionsAwaitingReview > 0 ? (
        <Notice className="mt-4" tone="info">
          {academy.assessment.result.awaitingReview(attempt.questionsAwaitingReview)}
        </Notice>
      ) : null}
    </Panel>
  );
  const answered = new Map(attempt.responses.map((response) => [response.questionId, response]));

  return (
    <div className="app-stack">
      <PageHeader
        actions={
          <Badge tone={attempt.passed ? "success" : "warning"}>
            {attempt.passed ? academy.assessment.result.passed : academy.assessment.result.notPassed}
          </Badge>
        }
        crumbs={crumbs}
        eyebrow={academy.assessmentKinds[assessment.kind]}
        heading={assessment.title}
      />

      {submitted ? <FocusOnMount>{resultPanel}</FocusOnMount> : resultPanel}

      <Panel>
        <ol className="grid gap-4">
          {assessment.questions.map((question, index) => {
            const response = answered.get(question.id);
            const verdict =
              response?.isCorrect === null || response === undefined
                ? question.options.length === 0
                  ? academy.assessment.result.awaiting
                  : academy.assessment.result.incorrect
                : response.isCorrect
                  ? academy.assessment.result.correct
                  : academy.assessment.result.incorrect;

            return (
              <li
                key={question.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-farm-border pb-4 last:border-0 last:pb-0"
              >
                <p className="max-w-xl type-body-sm text-farm-charcoal">
                  {academy.assessment.questionNumber(index + 1)}. {question.prompt}
                </p>
                <Badge
                  tone={
                    verdict === academy.assessment.result.correct
                      ? "success"
                      : verdict === academy.assessment.result.awaiting
                        ? "info"
                        : "danger"
                  }
                >
                  {verdict}
                </Badge>
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className="flex flex-wrap items-center gap-4">
        <ButtonLink href={moduleHref} icon="none" size="md" variant="secondary">
          {academy.lesson.backToModule}
        </ButtonLink>
        {assessment.canAttempt ? (
          <StartAttemptForm
            assessmentId={assessment.id}
            label={academy.assessment.result.retake}
            returnTo={moduleHref}
          />
        ) : (
          <p className="type-caption text-farm-muted">{academy.assessment.noAttemptsLeft}</p>
        )}
      </div>
    </div>
  );
}
