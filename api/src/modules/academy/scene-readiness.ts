import type { Prisma } from "../../generated/prisma/client.js";
import type { LessonSceneKind } from "../../generated/prisma/enums.js";

/*
  When a scene is complete enough for learners to see.

  A video scene needs its video, its captions and its still image: the
  production script requires captions for all narration, and the still image
  is what shows before anything downloads on a slow connection. A notes scene
  needs its text. Anything less stays with the content team.

  The rule exists twice — as a function for the content team's screens, and
  as a query for the learner's — so the two are kept here, side by side.
*/

/** Something a scene still needs, in the order the content team adds them. */
export type SceneGap = "VIDEO" | "CAPTIONS" | "POSTER" | "BODY";

type SceneParts = {
  kind: LessonSceneKind;
  body: string | null;
  videoAssetId: string | null;
  captionsAssetId: string | null;
  posterAssetId: string | null;
};

export function sceneGaps(scene: SceneParts): SceneGap[] {
  if (scene.kind === "NOTES") {
    return scene.body ? [] : ["BODY"];
  }

  const gaps: SceneGap[] = [];

  if (!scene.videoAssetId) gaps.push("VIDEO");
  if (!scene.captionsAssetId) gaps.push("CAPTIONS");
  if (!scene.posterAssetId) gaps.push("POSTER");

  return gaps;
}

/** The same rule as a query. A body is stored as null when empty, never "". */
export const readyScene = {
  OR: [
    {
      kind: "VIDEO",
      videoAssetId: { not: null },
      captionsAssetId: { not: null },
      posterAssetId: { not: null },
    },
    { kind: "NOTES", body: { not: null } },
  ],
} satisfies Prisma.LessonSceneWhereInput;
