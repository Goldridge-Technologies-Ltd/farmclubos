import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { StorageModule } from "./storage.module.js";
import { StorageService } from "./storage.service.js";

async function storageWith(settings: Record<string, string>): Promise<StorageService> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => settings] }),
      StorageModule,
    ],
  }).compile();

  return moduleRef.get(StorageService);
}

describe("StorageModule", () => {
  it("connects to storage when it is set up", async () => {
    const storage = await storageWith({
      STORAGE_ENDPOINT: "http://localhost:9000",
      STORAGE_BUCKET: "farmclub-media",
      STORAGE_ACCESS_KEY_ID: "key-id",
      STORAGE_SECRET_ACCESS_KEY: "secret",
    });

    expect(storage.configured).toBe(true);
  });

  it("still starts without storage, and says it is not set up", async () => {
    const storage = await storageWith({});

    expect(storage.configured).toBe(false);
  });
});
