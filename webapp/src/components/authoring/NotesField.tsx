"use client";

import { useRef, useState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { NotesView } from "@/components/learning/NotesView";
import { authoringContent } from "@/content/authoring";

type Edit = "heading" | "bold" | "italic" | "bulleted" | "numbered" | "link";

const EDITS: Edit[] = ["heading", "bold", "italic", "bulleted", "numbered", "link"];

/*
  Notes in the formatting syntax, with buttons that write it for you and a
  preview in the lesson's own type. A plain textarea underneath, so it works
  with a keyboard, a screen reader and paste from anywhere; the buttons are a
  convenience, never the only way.

  Controlled, unlike the app's other fields, because the preview needs the
  text as it is typed — which also means a refused save never wipes it.
*/
export function NotesField({
  name,
  label,
  hint,
  initial,
  error,
  tall = false,
}: {
  name: string;
  label: string;
  hint: string;
  initial: string;
  error?: string;
  /** Room for lesson notes, rather than a video's few lines. */
  tall?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [previewing, setPreviewing] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const copy = authoringContent.scene.editor;

  function apply(edit: Edit) {
    const element = area.current;

    if (!element) {
      return;
    }

    const { selectionStart: start, selectionEnd: end } = element;
    const change = rewrite(value, start, end, edit);

    setValue(change.value);

    // Once React has rendered the new text, put the selection where the next
    // keystroke belongs: inside the markers, or over the link's address.
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(change.selectionStart, change.selectionEnd);
    });
  }

  return (
    <Field error={error} hint={hint} label={label} name={name}>
      {({ id, describedBy, invalid }) => (
        <div className="grid gap-3">
          <div aria-label={copy.toolbar} className="flex flex-wrap gap-2" role="toolbar">
            {EDITS.map((edit) => (
              <Button
                key={edit}
                disabled={previewing}
                icon="none"
                onClick={() => apply(edit)}
                variant="secondary"
              >
                {copy[edit]}
              </Button>
            ))}
            <Button
              aria-pressed={previewing}
              icon="none"
              onClick={() => setPreviewing(!previewing)}
              variant="secondary"
            >
              {previewing ? copy.write : copy.preview}
            </Button>
          </div>

          {/* Hidden while previewing, but still submitted with the form. */}
          <textarea
            ref={area}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={`${fieldClass} ${tall ? "min-h-96" : "min-h-36"} py-3 leading-6`}
            hidden={previewing}
            id={id}
            maxLength={50000}
            name={name}
            onChange={(event) => setValue(event.target.value)}
            value={value}
          />

          {previewing ? (
            <div
              className={`rounded-button border border-farm-border bg-white p-5 ${tall ? "min-h-96" : "min-h-36"}`}
            >
              {value.trim() ? (
                <NotesView source={value} />
              ) : (
                <p className="type-body-sm text-farm-muted">{copy.nothing}</p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </Field>
  );
}

/** The text after one toolbar edit, and what to select in it next. */
function rewrite(
  value: string,
  start: number,
  end: number,
  edit: Edit,
): { value: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(start, end);

  const wrap = (marker: string) => ({
    value: value.slice(0, start) + marker + selected + marker + value.slice(end),
    selectionStart: start + marker.length,
    selectionEnd: end + marker.length,
  });

  const prefixLines = (prefix: (index: number) => string) => {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const nextBreak = value.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const block = value
      .slice(lineStart, lineEnd)
      .split("\n")
      .map((line, index) => prefix(index) + line)
      .join("\n");

    return {
      value: value.slice(0, lineStart) + block + value.slice(lineEnd),
      selectionStart: lineStart,
      selectionEnd: lineStart + block.length,
    };
  };

  switch (edit) {
    case "bold":
      return wrap("**");
    case "italic":
      return wrap("_");
    case "heading":
      return prefixLines(() => "## ");
    case "bulleted":
      return prefixLines(() => "- ");
    case "numbered":
      return prefixLines((index) => `${index + 1}. `);
    case "link": {
      const label = selected || "link text";
      const address = "https://";
      const inserted = `[${label}](${address})`;
      const addressStart = start + label.length + 3;

      return {
        value: value.slice(0, start) + inserted + value.slice(end),
        selectionStart: addressStart,
        selectionEnd: addressStart + address.length,
      };
    }
  }
}
