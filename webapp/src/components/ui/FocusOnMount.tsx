"use client";

import { useEffect, useRef, type ReactNode } from "react";

/*
  Moves focus to its content when it first appears.

  For content that replaces what someone was just working on — a quiz turning
  into its result. Focus brings it into view wherever the page was scrolled,
  and tells a screen reader that something new is there; without it they are
  left on a submit button that no longer exists.

  The focus ring is left alone (docs/design-system.md §3.2): browsers only
  draw it for keyboard users, which is exactly who needs to see where they are.
*/
export function FocusOnMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div ref={ref} className="rounded-panel" tabIndex={-1}>
      {children}
    </div>
  );
}
