import { MEDIA_RULES, mediaTypeFor } from "./media";

/*
  The type declared for an upload is signed into its link, so it has to be
  right before the file leaves the browser — and browsers are unreliable about
  it: most leave a .vtt file's type empty.
*/
describe("mediaTypeFor", () => {
  it("takes the browser's type when the slot accepts it", () => {
    expect(mediaTypeFor("VIDEO", { name: "scene.mp4", type: "video/mp4" })).toBe("video/mp4");
  });

  it("goes by the extension when the browser gives no type, as for captions", () => {
    expect(mediaTypeFor("CAPTIONS", { name: "scene.vtt", type: "" })).toBe("text/vtt");
    expect(mediaTypeFor("POSTER", { name: "STILL.JPG", type: "" })).toBe("image/jpeg");
  });

  it("refuses what the slot does not take, whatever it is called", () => {
    expect(mediaTypeFor("VIDEO", { name: "scene.mov", type: "video/quicktime" })).toBeNull();
    expect(mediaTypeFor("CAPTIONS", { name: "scene.srt", type: "application/x-subrip" })).toBeNull();
    expect(mediaTypeFor("POSTER", { name: "scene.mp4", type: "video/mp4" })).toBeNull();
  });
});

describe("MEDIA_RULES", () => {
  it("matches the limits the API enforces", () => {
    const MB = 1024 * 1024;

    expect(MEDIA_RULES.VIDEO.maxBytes).toBe(1024 * MB);
    expect(MEDIA_RULES.CAPTIONS.maxBytes).toBe(MB);
    expect(MEDIA_RULES.POSTER.maxBytes).toBe(5 * MB);
  });
});
