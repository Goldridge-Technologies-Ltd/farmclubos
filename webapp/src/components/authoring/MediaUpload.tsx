"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@farmclub/design-system/Button";
import { Notice } from "@farmclub/design-system/Notice";
import { ProgressBar } from "@farmclub/design-system/ProgressBar";
import { authoringContent } from "@/content/authoring";
import { completeUpload, requestUpload } from "@/lib/actions/authoring";
import type { MediaFile, MediaPurpose, UploadTicket } from "@/lib/api/contracts";
import { formatDay } from "@/lib/format";
import { MEDIA_RULES, mediaTypeFor, sizeOf } from "@/lib/media";

type Stage =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string; percent: number }
  | { kind: "checking" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/*
  One of a video scene's three files.

  The file never passes through this app or the API: a Server Action asks the
  API for a link signed for exactly this file's type and size, the browser
  sends the file straight to storage with it — showing how far it has got —
  and a second action has the API check what arrived before attaching it. So
  a large video costs our servers nothing, and a refused one never replaces
  what was there.

  Choosing a file does not upload it; the button does. In a published lesson
  a replacement reaches learners at once, so it should never be one slip away.
*/
export function MediaUpload({
  sceneId,
  purpose,
  current,
}: {
  sceneId: string;
  purpose: MediaPurpose;
  current: MediaFile | null;
}) {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const hintId = useId();
  const copy = authoringContent.scene;
  const slot = copy.slots[purpose];
  const rule = MEDIA_RULES[purpose];
  const busy = stage.kind === "uploading" || stage.kind === "checking";

  async function upload() {
    const file = input.current?.files?.[0];

    if (busy) {
      return;
    }

    if (!file) {
      setStage({ kind: "error", message: copy.choose(slot.label) + "." });
      return;
    }

    const contentType = mediaTypeFor(purpose, file);

    if (!contentType) {
      setStage({ kind: "error", message: copy.wrongType(copy.expected[purpose]) });
      return;
    }

    if (file.size > rule.maxBytes) {
      setStage({ kind: "error", message: copy.tooLarge(sizeOf(file.size), sizeOf(rule.maxBytes)) });
      return;
    }

    setStage({ kind: "uploading", fileName: file.name, percent: 0 });

    const start = await requestUpload({
      sceneId,
      purpose,
      fileName: file.name,
      contentType,
      sizeBytes: file.size,
    });

    if ("error" in start) {
      setStage({ kind: "error", message: start.error });
      return;
    }

    try {
      await send(start.ticket, file, (percent) =>
        setStage({ kind: "uploading", fileName: file.name, percent }),
      );
    } catch {
      setStage({ kind: "error", message: copy.interrupted });
      return;
    }

    setStage({ kind: "checking" });

    const result = await completeUpload(start.ticket.assetId, file.name);

    if (result.status === "error") {
      setStage({ kind: "error", message: result.message ?? copy.interrupted });
      return;
    }

    setStage({ kind: "done", message: result.message ?? copy.uploaded(file.name) });

    if (input.current) {
      input.current.value = "";
    }
  }

  return (
    <section className="grid gap-3 rounded-card border border-farm-border p-5">
      <div>
        <h3 className="text-base font-semibold text-farm-green-950">{slot.label}</h3>
        <p className="mt-1 type-caption text-farm-muted" id={hintId}>
          {slot.hint}
        </p>
      </div>

      <p className="text-sm leading-6 text-farm-charcoal">
        {current
          ? copy.current(current.fileName, sizeOf(current.sizeBytes), formatDay(current.uploadedAt))
          : copy.none}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor={inputId}>
          {copy.choose(slot.label)}
        </label>
        {/*
          The browser's own file picker, restyled only through file:, so it
          keeps its keyboard behaviour and its announcement.
        */}
        <input
          ref={input}
          accept={rule.accept}
          aria-describedby={hintId}
          className="max-w-full text-sm text-farm-muted file:mr-3 file:min-h-12 file:cursor-pointer file:rounded-button file:border file:border-farm-border-strong file:bg-white file:px-4 file:text-sm file:font-semibold file:text-farm-green-950 hover:file:bg-farm-cream-50"
          disabled={busy}
          id={inputId}
          onChange={() => setStage({ kind: "idle" })}
          type="file"
        />
        <Button busy={busy} icon="none" onClick={upload} variant={current ? "secondary" : "primary"}>
          {current ? copy.replace : copy.upload}
        </Button>
      </div>

      {/* The bar is outside the live region, so each percent is not read out. */}
      {stage.kind === "uploading" ? (
        <ProgressBar label={copy.progress(stage.fileName)} value={stage.percent} />
      ) : null}

      <div className="empty:hidden" role="status">
        {stage.kind === "uploading" ? (
          <Notice tone="busy">{copy.progress(stage.fileName)}…</Notice>
        ) : null}
        {stage.kind === "checking" ? <Notice tone="busy">{copy.checking}</Notice> : null}
        {stage.kind === "done" ? <Notice tone="success">{stage.message}</Notice> : null}
        {stage.kind === "error" ? <Notice tone="error">{stage.message}</Notice> : null}
      </div>
    </section>
  );
}

/**
 * Sends the file to storage with the signed link, reporting progress.
 * XMLHttpRequest rather than fetch: only it reports upload progress. The
 * headers are the signed ones, exactly; the browser sets the length itself.
 */
function send(ticket: UploadTicket, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open(ticket.method, ticket.url);

    for (const [name, value] of Object.entries(ticket.headers)) {
      request.setRequestHeader(name, value);
    }

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Storage answered ${request.status}`));
    request.onerror = () => reject(new Error("The upload was interrupted"));

    request.send(file);
  });
}
