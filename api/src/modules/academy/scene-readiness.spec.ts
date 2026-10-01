import { readyScene, sceneGaps } from "./scene-readiness.js";

const video = {
  kind: "VIDEO" as const,
  body: null,
  videoAssetId: "v",
  captionsAssetId: "c",
  posterAssetId: "p",
};
const notes = { ...video, kind: "NOTES" as const, videoAssetId: null, captionsAssetId: null, posterAssetId: null };

/*
  A scene a learner sees half-built is worse than none. A video needs its still
  image, which shows before anything downloads on a slow connection; captions
  are the content team's choice.
*/
describe("sceneGaps", () => {
  it("finds nothing missing from a video with its still image, captions or not", () => {
    expect(sceneGaps(video)).toEqual([]);
    expect(sceneGaps({ ...video, captionsAssetId: null })).toEqual([]);
  });

  it("names every file a video scene still needs, in upload order", () => {
    expect(sceneGaps({ ...video, videoAssetId: null, posterAssetId: null })).toEqual([
      "VIDEO",
      "POSTER",
    ]);
    expect(sceneGaps({ ...video, captionsAssetId: null, posterAssetId: null })).toEqual(["POSTER"]);
  });

  it("does not ask a video scene for notes, which are optional there", () => {
    expect(sceneGaps({ ...video, body: null })).toEqual([]);
  });

  it("needs text in a notes scene, and no files", () => {
    expect(sceneGaps({ ...notes, body: "Some notes" })).toEqual([]);
    expect(sceneGaps(notes)).toEqual(["BODY"]);
  });
});

describe("readyScene", () => {
  it("asks the database the same: a video with its still image, or notes with text", () => {
    expect(readyScene).toEqual({
      OR: [
        { kind: "VIDEO", videoAssetId: { not: null }, posterAssetId: { not: null } },
        { kind: "NOTES", body: { not: null } },
      ],
    });
  });
});
