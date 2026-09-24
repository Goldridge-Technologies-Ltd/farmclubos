"use client";

import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Notice } from "@farmclub/design-system/Notice";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { academy } from "@/content/academy";
import type { Assessment, Attempt } from "@/lib/api/contracts";
import { idleFormState } from "@/lib/actions/form-state";
import { saveAnswers, submitAttempt } from "@/lib/actions/learning";

/*
  Answering an assessment.

  The answers live in the form itself; this component keeps only what the form
  cannot express — which boxes are ticked, so a single-choice question can
  clear its sibling — and a note of when the draft was last saved.

  Autosave is deliberately quiet. It fires a second after typing or clicking
  stops, never on every keystroke, and its failure is not shown as an error:
  the answers are still in the form and submitting will send them. Shouting
  about a failed background save would be alarming and useless.
*/
export function AttemptForm({
  assessment,
  attempt,
}: {
  assessment: Assessment;
  attempt: Attempt;
}) {
  const [state, action, pending] = useActionState(submitAttempt, idleFormState);
  const pathname = usePathname();
  const [answers, setAnswers] = useState(() => initialAnswers(attempt));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Nothing to save on the first paint: that is what was just loaded.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void saveAnswers(attempt.id, toPayload(answers)).then((result) => {
        if (result.status === "success") {
          setSavedAt(new Date().toLocaleTimeString());
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [answers, attempt.id]);

  const setChoice = (questionId: string, optionId: string, single: boolean, on: boolean) => {
    setAnswers((current) => {
      const selected = new Set(current.options[questionId] ?? []);

      if (single) {
        selected.clear();
      }

      if (on) {
        selected.add(optionId);
      } else {
        selected.delete(optionId);
      }

      return { ...current, options: { ...current.options, [questionId]: [...selected] } };
    });
  };

  return (
    <form action={action} className="grid gap-6" noValidate>
      <input name="attemptId" type="hidden" value={attempt.id} />
      <input name="returnTo" type="hidden" value={pathname} />
      <FormStatus busy={pending ? academy.assessment.submitting : undefined} state={state} />

      <ol className="grid gap-5">
        {assessment.questions.map((question, index) => {
          const single = question.type !== "MULTIPLE_CHOICE";
          const selected = answers.options[question.id] ?? [];

          return (
            <li
              key={question.id}
              className="rounded-panel border border-farm-border bg-white p-6 sm:p-7"
            >
              <fieldset>
                <legend className="text-base font-semibold text-farm-green-950">
                  {academy.assessment.questionNumber(index + 1)}. {question.prompt}
                </legend>
                {question.helpText ? (
                  <p className="mt-2 type-body-sm text-farm-muted">{question.helpText}</p>
                ) : null}
                <p className="mt-2 type-caption text-farm-muted">
                  {question.type === "MULTIPLE_CHOICE"
                    ? academy.assessment.chooseAll
                    : question.type === "SHORT_ANSWER"
                      ? academy.assessment.writeAnswer
                      : academy.assessment.chooseOne}
                </p>

                {question.options.length > 0 ? (
                  <div className="mt-4 grid gap-2.5">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex min-h-12 cursor-pointer items-start gap-3 rounded-card border border-farm-border p-4 transition-colors hover:border-farm-border-strong hover:bg-farm-cream-50"
                      >
                        <input
                          checked={selected.includes(option.id)}
                          className="mt-0.5 h-4 w-4 accent-farm-green-800"
                          name={`option:${question.id}`}
                          onChange={(event) =>
                            setChoice(question.id, option.id, single, event.target.checked)
                          }
                          type={single ? "radio" : "checkbox"}
                          value={option.id}
                        />
                        <span className="type-body-sm text-farm-charcoal">{option.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className={`${fieldClass} mt-4 min-h-36 py-3 leading-6`}
                    name={`text:${question.id}`}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        text: { ...current.text, [question.id]: event.target.value },
                      }))
                    }
                    value={answers.text[question.id] ?? ""}
                  />
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {/*
        A written answer is marked by a person, so saying so before submitting
        is fairer than a score that silently leaves it out.
      */}
      {assessment.questions.some((question) => question.options.length === 0) ? (
        <Notice tone="info">{academy.assessment.writtenReviewed}</Notice>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button busy={pending} icon="none" type="submit">
          {pending ? academy.assessment.submitting : academy.assessment.submit}
        </Button>
        <p aria-live="polite" className="type-caption text-farm-muted">
          {savedAt ? academy.assessment.savedAt(savedAt) : academy.assessment.savesAsYouGo}
        </p>
      </div>
    </form>
  );
}

type Answers = { options: Record<string, string[]>; text: Record<string, string> };

/** Whatever was saved last time, so a resumed attempt is not started again. */
function initialAnswers(attempt: Attempt): Answers {
  const options: Record<string, string[]> = {};
  const text: Record<string, string> = {};

  for (const response of attempt.responses) {
    if (response.selectedOptionIds.length > 0) {
      options[response.questionId] = response.selectedOptionIds;
    }

    if (response.textAnswer) {
      text[response.questionId] = response.textAnswer;
    }
  }

  return { options, text };
}

function toPayload(answers: Answers) {
  const questionIds = new Set([
    ...Object.keys(answers.options),
    ...Object.keys(answers.text),
  ]);

  return [...questionIds].map((questionId) => ({
    questionId,
    selectedOptionIds: answers.options[questionId] ?? [],
    textAnswer: answers.text[questionId] ?? null,
  }));
}
