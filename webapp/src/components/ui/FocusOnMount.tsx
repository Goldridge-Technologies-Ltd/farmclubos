"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useHydrating } from "@/hooks/useHydrating";

/*
  Moves focus to its content when it first appears.

  For content that replaces what someone was just working on — a quiz turning
  into its result. Focus brings it into view wherever the page was scrolled,
  and tells a screen reader that something new is there; without it they are
  left on a submit button that no longer exists. On a page loaded afresh, a
  reload say, nothing was replaced, so focus stays where the browser puts it.

  The focus ring is left alone (docs/design-system.md §3.2): browsers only
  draw it for keyboard users, which is exactly who needs to see where they are.
*/
export function FocusOnMount({
  children,
  className = "rounded-panel",
}: {
  children: ReactNode;
  /** The radius of what it wraps, so the focus ring follows its corners. */
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hydrating = useHydrating();
  const freshLoad = useRef(hydrating);

  useEffect(() => {
    if (!freshLoad.current) {
      ref.current?.focus();
    }
  }, []);

  return (
    <div ref={ref} className={className} tabIndex={-1}>
      {children}
    </div>
  );
}
