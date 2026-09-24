"use client";

import { Button } from "@farmclub/design-system/Button";
import { Notice } from "@farmclub/design-system/Notice";
import { rootErrorScreen } from "@/content/app";

/** In Next.js 16 the prop is `retry`, not `reset`. */
export default function AppError({ retry }: { error: Error; retry: () => void }) {
  return (
    <main id="main-content" className="mx-auto grid max-w-md gap-5 px-5 py-20">
      <h1 className="type-h2-band text-farm-green-950">{rootErrorScreen.heading}</h1>
      <Notice tone="error">{rootErrorScreen.description}</Notice>
      <Button className="w-fit" icon="none" onClick={() => retry()} type="button">
        {rootErrorScreen.retry}
      </Button>
    </main>
  );
}
