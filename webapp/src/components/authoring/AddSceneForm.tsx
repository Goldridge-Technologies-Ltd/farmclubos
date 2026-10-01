"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { Icon } from "@farmclub/design-system/Icon";
import { FormStatus } from "@/components/form/FormStatus";
import { HiddenFields } from "@/components/form/HiddenFields";
import { authoringContent } from "@/content/authoring";
import { idleFormState } from "@/lib/actions/form-state";
import { createScene } from "@/lib/actions/authoring";
import type { SceneKind } from "@/lib/api/contracts";

const KINDS: { kind: SceneKind; icon: "video" | "book" }[] = [
  { kind: "VIDEO", icon: "video" },
  { kind: "NOTES", icon: "book" },
];

/*
  Adding a scene: its kind and a title. It opens next, for its files or its
  notes, so this form only ever shows an error.
*/
export function AddSceneForm({ lessonId }: { lessonId: string }) {
  const [state, action, pending] = useActionState(createScene, idleFormState);
  const copy = authoringContent.lesson.add;
  const chosen = state.values?.kind ?? "VIDEO";

  return (
    <form action={action} className="grid gap-5" noValidate>
      <HiddenFields fields={{ lessonId }} />
      <FormStatus busy={pending ? copy.busy : undefined} state={state} />

      <fieldset className="grid gap-3">
        <legend className="text-xs font-semibold text-farm-green-950">
          {copy.kind}
          <span aria-hidden="true" className="text-farm-green-700">
            {" "}
            *
          </span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {KINDS.map(({ kind, icon }) => (
            <label
              key={kind}
              className="flex min-h-12 cursor-pointer items-start gap-3 rounded-card border border-farm-border-strong p-4 transition-colors hover:bg-farm-cream-50 has-[:checked]:border-farm-green-700 has-[:checked]:bg-farm-cream-50"
            >
              <input
                className="mt-1 accent-farm-green-800"
                defaultChecked={chosen === kind}
                name="kind"
                required
                type="radio"
                value={kind}
              />
              <span className="grid gap-1">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-farm-green-950">
                  <Icon name={icon} size={18} className="text-farm-green-800" />
                  {authoringContent.lesson.kinds[kind]}
                </span>
                <span className="type-caption text-farm-muted">
                  {kind === "VIDEO" ? copy.videoHint : copy.notesHint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field error={state.errors?.title} label={authoringContent.fields.title} name="title" required>
        {({ id, describedBy, invalid }) => (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={fieldClass}
            defaultValue={state.values?.title}
            id={id}
            maxLength={200}
            name="title"
            required
          />
        )}
      </Field>

      <Button busy={pending} className="w-fit" icon="none" type="submit">
        {pending ? copy.busy : copy.submit}
      </Button>
    </form>
  );
}
