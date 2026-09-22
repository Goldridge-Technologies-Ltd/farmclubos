"use client";

import { Button } from "@farmclub/design-system/Button";
import { Notice } from "@farmclub/design-system/Notice";

/** In Next.js 16 the prop is `retry`, not `reset`. */
export default function AcceptInviteError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="grid gap-5">
      <h1 className="type-h2-band text-farm-green-950">We could not load your invitation</h1>
      <Notice tone="error">
        Something went wrong reaching FARMCLUB OS. Your invitation is unaffected.
      </Notice>
      <Button className="w-fit" icon="none" onClick={() => retry()} type="button">
        Try again
      </Button>
    </div>
  );
}
