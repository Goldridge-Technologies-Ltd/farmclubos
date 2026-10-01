"use client";

import { useActionState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { FormStatus } from "@/components/form/FormStatus";
import { HiddenFields } from "@/components/form/HiddenFields";
import { authoringContent } from "@/content/authoring";
import { updateScene } from "@/lib/actions/authoring";
import { idleFormState } from "@/lib/actions/form-state";
import type { SceneKind } from "@/lib/api/contracts";
import { NotesField } from "./NotesField";

/*
  A scene's title and text: a notes scene's notes, or the few lines under a
  video. Saving stays on the screen and says so; in a published lesson it
  reaches learners at once.
*/
export function SceneDetailsForm({
  sceneId,
  kind,
  saved,
}: {
  sceneId: string;
  kind: SceneKind;
  saved: { title: string; body: string | null };
}) {
  const [state, action, pending] = useActionState(updateScene, idleFormState);
  const copy = authoringContent.scene.fields;
  const details = authoringContent.details;

  return (
    <form action={action} className="grid gap-5" noValidate>
      <HiddenFields fields={{ sceneId }} />
      <FormStatus busy={pending ? details.busy : undefined} state={state} />

      <Field error={state.errors?.title} label={authoringContent.fields.title} name="title" required>
        {({ id, describedBy, invalid }) => (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={fieldClass}
            defaultValue={state.values?.title ?? saved.title}
            id={id}
            maxLength={200}
            name="title"
            required
          />
        )}
      </Field>

      <NotesField
        error={state.errors?.body}
        hint={kind === "VIDEO" ? copy.supportingHint : copy.notesHint}
        initial={saved.body ?? ""}
        label={kind === "VIDEO" ? copy.supportingText : copy.notes}
        name="body"
        tall={kind === "NOTES"}
      />

      <p className="type-caption text-farm-muted">{authoringContent.fields.requiredNote}</p>

      <Button busy={pending} className="w-fit" icon="none" type="submit">
        {pending ? details.busy : details.submit}
      </Button>
    </form>
  );
}
