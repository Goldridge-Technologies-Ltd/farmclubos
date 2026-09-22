"use client";

import { Button } from "@farmclub/design-system/Button";
import { Notice } from "@farmclub/design-system/Notice";

/** In Next.js 16 the prop is `retry`, not `reset`. */
export default function AppError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto grid max-w-md gap-5 px-5 py-20">
      <h1 className="type-h2-band text-farm-green-950">Something went wrong</h1>
      <Notice tone="error">
        We could not finish that. Try again, and if it keeps happening, tell your
        institution&rsquo;s administrator.
      </Notice>
      <Button className="w-fit" icon="none" onClick={() => retry()} type="button">
        Try again
      </Button>
    </div>
  );
}
