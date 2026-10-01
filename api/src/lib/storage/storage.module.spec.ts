import { ConfigModule } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { join } from "node:path";
import { LocalFileStore } from "./drivers/local-file-store.js";
import { S3FileStore } from "./drivers/s3-file-store.js";
import { FILE_STORE, type FileStore } from "./file-store.js";
import { StorageModule } from "./storage.module.js";

const BASE = { PORT: 4000, API_GLOBAL_PREFIX: "api", JWT_ACCESS_SECRET: "a".repeat(32) };

async function storageWith(settings: Record<string, unknown>): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({ ...BASE, ...settings })] }),
      StorageModule,
    ],
  }).compile();
}

describe("StorageModule", () => {
  it("keeps files in a folder unless told otherwise", async () => {
    const moduleRef = await storageWith({ STORAGE_DRIVER: "local", STORAGE_LOCAL_DIR: ".storage" });

    expect(moduleRef.get<FileStore>(FILE_STORE)).toBeInstanceOf(LocalFileStore);
    expect(moduleRef.get(LocalFileStore).folder).toBe(join(process.cwd(), ".storage"));
  });

  it("uses S3-compatible storage with STORAGE_DRIVER=s3", async () => {
    const moduleRef = await storageWith({
      STORAGE_DRIVER: "s3",
      STORAGE_ENDPOINT: "http://localhost:9000",
      STORAGE_BUCKET: "farmclub-media",
      STORAGE_ACCESS_KEY_ID: "key-id",
      STORAGE_SECRET_ACCESS_KEY: "secret",
    });

    expect(moduleRef.get<FileStore>(FILE_STORE)).toBeInstanceOf(S3FileStore);
  });

  it("links local files to this API's own storage route by default", async () => {
    const moduleRef = await storageWith({ STORAGE_DRIVER: "local", PORT: 4100 });

    await expect(moduleRef.get(LocalFileStore).signDownload("lessons/a.mp4")).resolves.toMatch(
      /^http:\/\/localhost:4100\/api\/storage\/lessons\/a\.mp4\?/,
    );
  });

  it("links them to another address when given one", async () => {
    const moduleRef = await storageWith({
      STORAGE_DRIVER: "local",
      STORAGE_LOCAL_PUBLIC_URL: "http://192.168.1.20:4000/api/storage",
    });

    await expect(moduleRef.get(LocalFileStore).signDownload("lessons/a.mp4")).resolves.toMatch(
      /^http:\/\/192\.168\.1\.20:4000\/api\/storage\/lessons\/a\.mp4\?/,
    );
  });
});
