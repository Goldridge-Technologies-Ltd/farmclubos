"use client";

import { Button } from "@farmclub/design-system/Button";
import { Notice } from "@farmclub/design-system/Notice";
import { authContent } from "@/content/auth";

/** In Next.js 16 the prop is `retry`, not `reset`. */
export default function AcceptInviteError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="grid gap-5">
      <h1 className="type-h2-band text-farm-green-950">
        {authContent.acceptInvite.loadError.heading}
      </h1>
      <Notice tone="error">{authContent.acceptInvite.loadError.description}</Notice>
      <Button className="w-fit" icon="none" onClick={() => retry()} type="button">
        {authContent.acceptInvite.loadError.retry}
      </Button>
    </div>
  );
}
