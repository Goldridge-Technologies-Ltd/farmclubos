import { jest } from "@jest/globals";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { PresignUrl } from "../storage.tokens.js";
import { S3FileStore } from "./s3-file-store.js";

/*
  The S3 client and the presigner are replaced, so these check what is asked
  of storage — which bucket, which key, which headers are signed, how long a
  link lasts — without a network.
*/
describe("S3FileStore", () => {
  let send: jest.Mock<(command: unknown) => Promise<unknown>>;
  let presign: jest.Mock<PresignUrl>;
  let storage: S3FileStore;

  beforeEach(() => {
    send = jest.fn<(command: unknown) => Promise<unknown>>();
    presign = jest.fn<PresignUrl>().mockResolvedValue("https://storage.example/signed");
    storage = new S3FileStore({ send }, "farmclub-media", presign as unknown as PresignUrl);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("signUpload", () => {
    it("signs a PUT of one declared type and size to one key, for fifteen minutes", async () => {
      jest.useFakeTimers({ now: new Date("2026-09-30T10:00:00Z"), doNotFake: ["nextTick", "setImmediate"] });

      const ticket = await storage.signUpload("lessons/a/video.mp4", "video/mp4", 1_048_576);

      const [, command, options] = presign.mock.calls[0] as unknown as [
        unknown,
        PutObjectCommand,
        { expiresIn: number; signableHeaders: Set<string> },
      ];
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toEqual({
        Bucket: "farmclub-media",
        Key: "lessons/a/video.mp4",
        ContentType: "video/mp4",
        ContentLength: 1_048_576,
      });
      expect(options.expiresIn).toBe(900);
      // Signed, so the browser cannot send a different type or a bigger file.
      expect([...options.signableHeaders]).toEqual(
        expect.arrayContaining(["content-type", "content-length"]),
      );
      expect(ticket).toEqual({
        url: "https://storage.example/signed",
        headers: { "Content-Type": "video/mp4" },
        expiresAt: new Date("2026-09-30T10:15:00Z"),
      });
    });
  });

  describe("signDownload", () => {
    it("signs a GET that stays the same for the rest of the hour, so browsers can cache it", async () => {
      jest.useFakeTimers({ now: new Date("2026-09-30T10:42:13Z"), doNotFake: ["nextTick", "setImmediate"] });

      await storage.signDownload("lessons/a/video.mp4");

      const [, command, options] = presign.mock.calls[0] as unknown as [
        unknown,
        GetObjectCommand,
        { expiresIn: number; signingDate: Date },
      ];
      expect(command).toBeInstanceOf(GetObjectCommand);
      expect(command.input).toEqual({ Bucket: "farmclub-media", Key: "lessons/a/video.mp4" });
      expect(options.signingDate).toEqual(new Date("2026-09-30T10:00:00Z"));
      // Two hours from the top of the hour: always at least one left to play it.
      expect(options.expiresIn).toBe(7200);
    });
  });

  describe("inspect", () => {
    it("reports the size and type storage holds", async () => {
      send.mockResolvedValue({ ContentLength: 2048, ContentType: "text/vtt" });

      await expect(storage.inspect("lessons/a/captions.vtt")).resolves.toEqual({
        sizeBytes: 2048,
        contentType: "text/vtt",
      });
      expect(send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
    });

    it("is null when nothing was uploaded", async () => {
      send.mockRejectedValue(Object.assign(new Error("NotFound"), { $metadata: { httpStatusCode: 404 } }));

      await expect(storage.inspect("lessons/a/missing.mp4")).resolves.toBeNull();
    });

    it("lets any other failure through, since it is not the same as a missing file", async () => {
      send.mockRejectedValue(Object.assign(new Error("Slow down"), { $metadata: { httpStatusCode: 503 } }));

      await expect(storage.inspect("lessons/a/video.mp4")).rejects.toThrow("Slow down");
    });
  });

  describe("readText", () => {
    it("reads a small text file such as captions", async () => {
      send.mockResolvedValue({
        ContentLength: 12,
        Body: { transformToString: () => Promise.resolve("WEBVTT\n\nHi") },
      });

      await expect(storage.readText("lessons/a/captions.vtt")).resolves.toBe("WEBVTT\n\nHi");
      expect(send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
    });
  });

  describe("remove", () => {
    it("deletes the file at a key", async () => {
      send.mockResolvedValue({});

      await storage.remove("lessons/a/video.mp4");

      const command = send.mock.calls[0][0] as DeleteObjectCommand;
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input).toEqual({ Bucket: "farmclub-media", Key: "lessons/a/video.mp4" });
    });
  });

  describe("without its settings", () => {
    it("fails plainly if used, though validation never lets it be chosen so", async () => {
      const unset = new S3FileStore(null, null, presign as unknown as PresignUrl);

      await expect(unset.signDownload("k")).rejects.toThrow(/STORAGE_DRIVER=s3/);
    });
  });
});
