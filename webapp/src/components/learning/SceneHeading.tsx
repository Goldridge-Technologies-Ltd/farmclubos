"use client";

import { useEffect, useRef, type ReactNode } from "react";

/*
  A scene's title, which takes focus when the learner moves to another scene.

  Continue and Back swap the scene in place, leaving focus on a button whose
  meaning just changed; a keyboard or screen-reader user pressing on would
  skip scenes they never heard. Moving focus to the new title reads it out
  and brings it into view. Not on the first arrival, though — someone opening
  the lesson keeps focus where the page would put it.
*/
export function SceneHeading({ sceneId, children }: { sceneId: string; children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (shown.current !== null && shown.current !== sceneId) {
      heading.current?.focus();
    }

    shown.current = sceneId;
  }, [sceneId]);

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
