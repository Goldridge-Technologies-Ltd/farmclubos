import { transcriptFromVtt } from "./captions.js";

/*
  The transcript learners read is made from the captions file, so the two can
  never disagree. A file that is not WebVTT must be refused rather than turned
  into nonsense on the lesson page.
*/
describe("transcriptFromVtt", () => {
  it("reads the spoken text, leaving out timings and cue numbers", () => {
    const vtt = [
      "WEBVTT",
      "",
      "1",
      "00:00:00.000 --> 00:00:03.000",
      "Welcome to Enterprise Mindset.",
      "",
      "2",
      "00:00:03.000 --> 00:00:06.500",
      "In this module, you will learn",
      "to see agriculture as an enterprise.",
    ].join("\n");

    expect(transcriptFromVtt(vtt)).toBe(
      "Welcome to Enterprise Mindset. In this module, you will learn to see agriculture as an enterprise.",
    );
  });

  it("starts a new paragraph after a pause in the narration", () => {
    const vtt = [
      "WEBVTT",
      "",
      "00:01.000 --> 00:03.000",
      "Imagine a grower.",
      "",
      "00:06.000 --> 00:08.000",
      "Now ask a different question.",
    ].join("\n");

    expect(transcriptFromVtt(vtt)).toBe("Imagine a grower.\n\nNow ask a different question.");
  });

  it("drops styling and voice tags, and decodes entities", () => {
    const vtt = "WEBVTT\n\n00:00.000 --> 00:02.000\n<v Narrator><i>Value</i> &amp; risk</v>\n";

    expect(transcriptFromVtt(vtt)).toBe("Value & risk");
  });

  it("ignores notes, styles and a byte-order mark, and Windows line endings", () => {
    const vtt =
      "\uFEFFWEBVTT - Enterprise Mindset\r\n\r\nNOTE Recorded 2026\r\n\r\nSTYLE\r\n::cue { color: white }\r\n\r\n" +
      "00:00.000 --> 00:01.000 align:start\r\nHello.\r\n";

    expect(transcriptFromVtt(vtt)).toBe("Hello.");
  });

  it("refuses a file that is not WebVTT", () => {
    expect(transcriptFromVtt("1\n00:00:00,000 --> 00:00:01,000\nAn SRT file\n")).toBeNull();
    expect(transcriptFromVtt("<html></html>")).toBeNull();
  });

  it("refuses WebVTT with no captions in it", () => {
    expect(transcriptFromVtt("WEBVTT\n\nNOTE nothing here\n")).toBeNull();
  });
});
