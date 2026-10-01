import { jest } from "@jest/globals";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { LocalFileStore } from "./local-file-store.js";

const PUBLIC_URL = "http://localhost:4000/api/storage";
const KEY = "lessons/l1/scenes/s1/video/f1.mp4";

/** The query of a signed link, as the controller receives it. */
function linkOf(url: string): { expires: number; signature: string } {
  const query = new URL(url).searchParams;

  return { expires: Number(query.get("expires")), signature: query.get("signature") ?? "" };
}

/*
  Files in a folder on this machine, behaving as S3 does where it matters:
  links are signed and expire, an upload's type and exact size are part of its
  signature, and storage reports what actually arrived.
*/
describe("LocalFileStore", () => {
  let root: string;
  let store: LocalFileStore;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "farmclub-files-"));
    store = new LocalFileStore({ root, publicUrl: PUBLIC_URL, secret: "a-secret-only-the-api-knows" });
  });

  afterEach(async () => {
    jest.useRealTimers();
    await rm(root, { recursive: true, force: true });
  });

  describe("signUpload", () => {
    it("signs a PUT of one declared type and size to one key, for fifteen minutes", async () => {
      jest.useFakeTimers({ now: new Date("2026-09-30T10:00:00Z"), doNotFake: ["nextTick", "setImmediate"] });

      const ticket = await store.signUpload(KEY, "video/mp4", 1_048_576);

      expect(ticket.url.startsWith(`${PUBLIC_URL}/${KEY}?`)).toBe(true);
      expect(linkOf(ticket.url).expires).toBe(Date.parse("2026-09-30T10:15:00Z") / 1000);
      expect(ticket.headers).toEqual({ "Content-Type": "video/mp4" });
      expect(ticket.expiresAt).toEqual(new Date("2026-09-30T10:15:00Z"));
    });

    it("accepts the upload it was signed for, and nothing else", async () => {
      const link = linkOf((await store.signUpload(KEY, "video/mp4", 2048)).url);

      expect(() => store.verifyUpload(KEY, link, "video/mp4", 2048)).not.toThrow();
      // A bigger file, another type or another key would each need its own signature.
      for (const attempt of [
        () => store.verifyUpload(KEY, link, "video/mp4", 2049),
        () => store.verifyUpload(KEY, link, "video/webm", 2048),
        () => store.verifyUpload(KEY, link, undefined, 2048),
        () => store.verifyUpload("lessons/l1/scenes/s1/video/other.mp4", link, "video/mp4", 2048),
        () => store.verifyUpload(KEY, { ...link, signature: "forged" }, "video/mp4", 2048),
      ]) {
        expect(attempt).toThrow(expect.objectContaining({ response: expect.objectContaining({ code: "SIGNATURE_MISMATCH" }) }));
      }
    });

    it("stops working once it expires", async () => {
      jest.useFakeTimers({ now: new Date("2026-09-30T10:00:00Z"), doNotFake: ["nextTick", "setImmediate"] });
      const link = linkOf((await store.signUpload(KEY, "video/mp4", 2048)).url);

      jest.setSystemTime(new Date("2026-09-30T10:15:01Z"));

      expect(() => store.verifyUpload(KEY, link, "video/mp4", 2048)).toThrow(ForbiddenException);
      expect(() => store.verifyUpload(KEY, link, "video/mp4", 2048)).toThrow(
        expect.objectContaining({ response: expect.objectContaining({ code: "LINK_EXPIRED" }) }),
      );
    });
  });

  describe("signDownload", () => {
    it("gives the same link for the rest of the hour, so browsers can cache it", async () => {
      jest.useFakeTimers({ now: new Date("2026-09-30T10:05:00Z"), doNotFake: ["nextTick", "setImmediate"] });
      const early = await store.signDownload(KEY);

      jest.setSystemTime(new Date("2026-09-30T10:59:59Z"));
      const late = await store.signDownload(KEY);

      expect(late).toBe(early);
      // Two hours from the top of the hour: always at least one left to play it.
      expect(linkOf(early).expires).toBe(Date.parse("2026-09-30T12:00:00Z") / 1000);
      expect(() => store.verifyDownload(KEY, linkOf(early))).not.toThrow();
    });

    it("cannot be used to upload, nor an upload link to download", async () => {
      const download = linkOf(await store.signDownload(KEY));
      const upload = linkOf((await store.signUpload(KEY, "video/mp4", 2048)).url);

      expect(() => store.verifyUpload(KEY, download, "video/mp4", 2048)).toThrow(ForbiddenException);
      expect(() => store.verifyDownload(KEY, upload)).toThrow(ForbiddenException);
    });
  });

  describe("receive", () => {
    it("keeps the file with the type it was sent as, and reports both back", async () => {
      await store.receive(KEY, Readable.from([Buffer.from("WEBVTT\n\n"), Buffer.from("Hi")]), 10, "text/vtt");

      await expect(store.inspect(KEY)).resolves.toEqual({ sizeBytes: 10, contentType: "text/vtt" });
      await expect(store.readText(KEY)).resolves.toBe("WEBVTT\n\nHi");
    });

    it("refuses a file of another size than signed, and leaves nothing behind", async () => {
      await expect(
        store.receive(KEY, Readable.from([Buffer.from("12345")]), 4, "video/mp4"),
      ).rejects.toThrow(BadRequestException);
      await expect(
        store.receive(KEY, Readable.from([Buffer.from("123")]), 4, "video/mp4"),
      ).rejects.toMatchObject({ response: { code: "UPLOAD_SIZE_MISMATCH" } });

      await expect(store.inspect(KEY)).resolves.toBeNull();
      await expect(readdir(join(root, "lessons/l1/scenes/s1/video"))).resolves.toEqual([]);
    });
  });

  describe("inspect", () => {
    it("is null when nothing was uploaded", async () => {
      await expect(store.inspect(KEY)).resolves.toBeNull();
    });
  });

  describe("remove", () => {
    it("deletes the file and what was recorded about it", async () => {
      await store.receive(KEY, Readable.from([Buffer.from("1234")]), 4, "video/mp4");

      await store.remove(KEY);

      await expect(store.inspect(KEY)).resolves.toBeNull();
    });

    it("does not mind a file that is not there", async () => {
      await expect(store.remove(KEY)).resolves.toBeUndefined();
    });
  });

  describe("pathOf", () => {
    it("keeps every key inside its folder, out of reach of the type records", () => {
      expect(store.pathOf(KEY)).toBe(join(root, KEY));

      for (const key of ["../outside.mp4", "lessons/../../outside.mp4", "/etc/passwd", ".meta/x.json", "a//b", ""]) {
        expect(() => store.pathOf(key)).toThrow(BadRequestException);
      }
    });
  });
});
