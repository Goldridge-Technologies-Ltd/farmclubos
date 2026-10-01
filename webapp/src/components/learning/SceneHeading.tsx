"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useHydrating } from "@/hooks/useHydrating";

/*
  A scene's title, which takes focus when the learner moves to another scene.

  Continue and Back swap the scene, leaving focus on a button whose meaning
  just changed, or on nothing at all; a keyboard or screen-reader user
  pressing on would skip scenes they never heard. Moving focus to the new
  title reads it out and brings it into view.

  Every move between scenes names the scene in the address, so that is the
  signal rather than a memory of the scene before: Continue records the scene
  through a Server Action, and its redirect remounts the page, memory and all.
  Arriving is not moving, though. Opening the lesson names no scene, and on a
  page loaded afresh at a scene, focus stays where the browser puts it until
  the learner moves on.
*/
export function SceneHeading({
  sceneId,
  moveFocus,
  children,
}: {
  sceneId: string;
  /** Whether the address named this scene, as every move between scenes does. */
  moveFocus: boolean;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const hydrating = useHydrating();
  // The scene a fresh load arrived at, until the learner moves on from it.
  const arrivedAt = useRef(hydrating ? sceneId : null);

  useEffect(() => {
    if (sceneId === arrivedAt.current) {
      return;
    }

    arrivedAt.current = null;

    if (moveFocus) {
      heading.current?.focus();
    }
  }, [sceneId, moveFocus]);

  return (
    <h2
      ref={heading}
      className="mt-2 rounded-button type-h2-panel text-farm-green-950"
      tabIndex={-1}
    >
      {children}
    </h2>
  );
}
