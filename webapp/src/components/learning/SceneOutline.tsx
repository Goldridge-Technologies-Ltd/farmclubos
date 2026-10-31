import Link from "next/link";
import { Icon } from "@farmclub/design-system/Icon";
import { academy } from "@/content/academy";
import type { LessonScene } from "@/lib/api/contracts";

/*
  Every scene in the lesson, the current one marked and finished ones ticked,
  so a learner can see where they are and go back over any of them. Beside the
  scene from lg, below it on a phone.
*/
export function SceneOutline({
  scenes,
  lessonHref,
  current,
  done,
}: {
  /** The learner's scenes, or the content team's preview of them. */
  scenes: Pick<LessonScene, "id" | "title">[];
  /** Where the lesson is; each scene adds its number to it. */
  lessonHref: string;
  /** Index of the scene on screen, or null on the lesson's end. */
  current: number | null;
  done: ReadonlySet<string>;
}) {
  const copy = academy.scene;

  return (
    <nav aria-labelledby="scene-outline" className="rounded-panel border border-farm-border bg-white p-5">
      <h2 className="type-overline text-farm-green-700" id="scene-outline">
        {copy.outline}
      </h2>
      <ol className="mt-3 grid gap-1">
        {scenes.map((scene, index) => {
          const finished = done.has(scene.id);

          return (
            <li key={scene.id}>
              <Link
                aria-current={index === current ? "step" : undefined}
                className="flex min-h-12 items-center gap-3 rounded-button px-2 py-2 text-sm text-farm-charcoal transition-colors hover:bg-farm-cream-50 aria-[current=step]:bg-farm-green-50 aria-[current=step]:font-semibold aria-[current=step]:text-farm-green-950"
                href={`${lessonHref}?scene=${index + 1}`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    finished ? "bg-farm-green-700 text-white" : "border border-farm-border-strong text-farm-muted"
                  }`}
                >
                  {finished ? <Icon name="tick" size={14} /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">{scene.title}</span>
                {finished ? <span className="sr-only">{copy.completed}</span> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
