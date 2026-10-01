import type { INestApplication } from "@nestjs/common";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import type { ApiErrorResponse } from "../src/common/http/api-response.js";
import { StorageModule } from "../src/lib/storage/storage.module.js";
import { StorageService } from "../src/lib/storage/storage.service.js";
import { createTestApp } from "./support/create-test-app.js";

const asFailure = (body: unknown) => body as ApiErrorResponse;

const KEY = "lessons/l1/scenes/s1/video/f1.mp4";

/** A signed link's path and query, as supertest wants them. */
const pathOf = (url: string) => {
  const parsed = new URL(url);

  return `${parsed.pathname}${parsed.search}`;
};

/*
  The local driver's storage routes, end to end: a file uploaded through a
  signed link comes back through another, a video can be read a range at a
  time (as a player seeks), and anything the link was not signed for is
  refused.
*/
describe("Local files (e2e)", () => {
  let app: INestApplication;
  let storage: StorageService;
  let folder: string;

  beforeAll(async () => {
    folder = await mkdtemp(join(tmpdir(), "farmclub-e2e-files-"));
    ({ app } = await createTestApp({
      imports: [StorageModule],
      realStorage: true,
      env: { STORAGE_DRIVER: "local", STORAGE_LOCAL_DIR: folder, PORT: 4000 },
    }));
    storage = app.get(StorageService);
  });

  afterAll(async () => {
    await app.close();
    await rm(folder, { recursive: true, force: true });
  });

  it("keeps an upload made through its link, and plays it back, a range at a time", async () => {
    const ticket = await storage.signUpload(KEY, "video/mp4", 5);

    await request(app.getHttpServer())
      .put(pathOf(ticket.url))
      .set("Content-Type", "video/mp4")
      .send(Buffer.from("12345"))
      .expect(200);

    const download = pathOf(await storage.signDownload(KEY));

    const whole = await request(app.getHttpServer()).get(download).buffer(true).expect(200);
    expect(whole.headers["content-type"]).toBe("video/mp4");
    expect(whole.headers["accept-ranges"]).toBe("bytes");
    expect(Buffer.from(whole.body as Buffer).toString()).toBe("12345");

    const part = await request(app.getHttpServer())
      .get(download)
      .set("Range", "bytes=1-3")
      .buffer(true)
      .expect(206);
    expect(part.headers["content-range"]).toBe("bytes 1-3/5");
    expect(Buffer.from(part.body as Buffer).toString()).toBe("234");

    await expect(storage.inspect(KEY)).resolves.toEqual({ sizeBytes: 5, contentType: "video/mp4" });
  });

  it("refuses an upload of another size or type than its link was signed for", async () => {
    const ticket = await storage.signUpload(KEY, "video/mp4", 5);

    const larger = await request(app.getHttpServer())
      .put(pathOf(ticket.url))
      .set("Content-Type", "video/mp4")
      .send(Buffer.from("123456"))
      .expect(403);
    expect(asFailure(larger.body).error.code).toBe("SIGNATURE_MISMATCH");

    await request(app.getHttpServer())
      .put(pathOf(ticket.url))
      .set("Content-Type", "video/webm")
      .send(Buffer.from("12345"))
      .expect(403);
  });

  it("refuses a link that was tampered with, or one with no signature", async () => {
    const download = new URL(await storage.signDownload(KEY));
    download.searchParams.set("signature", "forged");

    const forged = await request(app.getHttpServer()).get(pathOf(download.toString())).expect(403);
    expect(asFailure(forged.body).error.code).toBe("SIGNATURE_MISMATCH");

    await request(app.getHttpServer()).get(`/api/storage/${KEY}`).expect(400);
  });

  it("is not found for a file that was never uploaded", async () => {
    const missing = await storage.signDownload("lessons/l1/scenes/s1/video/never.mp4");

    const response = await request(app.getHttpServer()).get(pathOf(missing)).expect(404);
    expect(asFailure(response.body).success).toBe(false);
  });
});

describe("Local files with the s3 driver (e2e)", () => {
  it("are not served at all", async () => {
    const { app } = await createTestApp({
      imports: [StorageModule],
      realStorage: true,
      env: {
        STORAGE_DRIVER: "s3",
        STORAGE_ENDPOINT: "http://localhost:9000",
        STORAGE_BUCKET: "farmclub-media",
        STORAGE_ACCESS_KEY_ID: "key-id",
        STORAGE_SECRET_ACCESS_KEY: "secret",
      },
    });

    await request(app.getHttpServer())
      .get(`/api/storage/${KEY}?expires=1790000000&signature=x`)
      .expect(404);

    await app.close();
  });
});
