import { sceneGaps } from "./scene-readiness.js";

const video = {
  kind: "VIDEO" as const,
  body: null,
  videoAssetId: "v",
  captionsAssetId: "c",
  posterAssetId: "p",
};
const notes = { ...video, kind: "NOTES" as const, videoAssetId: null, captionsAssetId: null, posterAssetId: null };

/*
  A scene a learner sees half-built is worse than none, and a video without
  captions fails the accessibility rule the production script sets.
*/
describe("sceneGaps", () => {
  it("finds nothing missing from a video with its captions and still image", () => {
    expect(sceneGaps(video)).toEqual([]);
  });

  it("names every file a video scene still needs, in upload order", () => {
    expect(sceneGaps({ ...video, videoAssetId: null, posterAssetId: null })).toEqual([
      "VIDEO",
      "POSTER",
    ]);
    expect(sceneGaps({ ...video, captionsAssetId: null })).toEqual(["CAPTIONS"]);
  });

  it("does not ask a video scene for notes, which are optional there", () => {
    expect(sceneGaps({ ...video, body: null })).toEqual([]);
  });

  it("needs text in a notes scene, and no files", () => {
    expect(sceneGaps({ ...notes, body: "Some notes" })).toEqual([]);
    expect(sceneGaps(notes)).toEqual(["BODY"]);
  });
});
