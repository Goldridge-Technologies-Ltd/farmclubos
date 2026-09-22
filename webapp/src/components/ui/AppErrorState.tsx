"use client";

import { Button } from "@farmclub/design-system/Button";
import { Notice } from "@farmclub/design-system/Notice";
import { errorScreen } from "@/content/app";

/*
  What an `error.tsx` segment renders.

  Every data-loading segment needs one (docs/webapp/design-patterns.md §2),
  and they would otherwise each hand-write the same three elements. The error
  itself is never shown: it is a server stack trace or an internal code, and
  neither helps the person reading it.
*/
export function AppErrorState({
  retry,
  title = errorScreen.title,
  description = errorScreen.description,
}: {
  retry: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="max-w-xl">
      <h1 className="type-h2-band text-farm-green-950">{title}</h1>
      <Notice className="mt-5" tone="error">
        {description}
      </Notice>
      <Button className="mt-6" icon="none" onClick={() => retry()} type="button">
        {errorScreen.retry}
      </Button>
    </div>
  );
}
