/**
 * Which of a lesson's scenes to show, as an index from 0.
 *
 * The scene asked for in the address when it is one of the lesson's (counted
 * from 1, as people count); otherwise, for an enrolled learner, the first they
 * have not finished — where they stopped — or the first scene once they have
 * finished them all. Someone not enrolled starts at the beginning.
 */
export function sceneToShow(
  requested: string | undefined,
  scenes: { id: string }[],
  done: ReadonlySet<string>,
  enrolled: boolean,
): number {
  const asked = requested && /^\d+$/.test(requested) ? Number(requested) : NaN;

  if (asked >= 1 && asked <= scenes.length) {
    return asked - 1;
  }

  if (!enrolled) {
    return 0;
  }

  const unfinished = scenes.findIndex((scene) => !done.has(scene.id));

  return unfinished === -1 ? 0 : unfinished;
}
