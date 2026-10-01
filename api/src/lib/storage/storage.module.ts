import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import { StorageDriver } from "../../config/env.validation.js";
import {
  LOCAL_FILE_OPTIONS,
  LocalFileStore,
  type LocalFileOptions,
} from "./drivers/local-file-store.js";
import { S3FileStore } from "./drivers/s3-file-store.js";
import { FILE_STORE, type FileStore } from "./file-store.js";
import { LocalFilesController } from "./local-files.controller.js";
import { StorageService } from "./storage.service.js";
import { OBJECT_STORE, PRESIGN_URL, STORAGE_BUCKET } from "./storage.tokens.js";

/*
  Infrastructure module: global, exports its service, imported once in
  AppModule (api/AGENTS.md).

  Both drivers are registered so Nest constructs them, as the mail module does
  its transports, and STORAGE_DRIVER picks the one StorageService receives:
  `local`, a folder on this machine, or `s3`. The local driver's routes answer
  only while it is the one in use.
*/
@Global()
@Module({
  controllers: [LocalFilesController],
  providers: [
    {
      provide: OBJECT_STORE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): S3Client | null => {
        const endpoint = config.get<string>("STORAGE_ENDPOINT");
        const accessKeyId = config.get<string>("STORAGE_ACCESS_KEY_ID");
        const secretAccessKey = config.get<string>("STORAGE_SECRET_ACCESS_KEY");

        if (!endpoint || !accessKeyId || !secretAccessKey) {
          return null;
        }

        return new S3Client({
          endpoint,
          region: config.get<string>("STORAGE_REGION", "auto"),
          credentials: { accessKeyId, secretAccessKey },
          // The bucket goes in the path rather than the host name, which both
          // R2 and RustFS accept, so one setting serves both.
          forcePathStyle: true,
        });
      },
    },
    {
      provide: STORAGE_BUCKET,
      inject: [ConfigService],
      useFactory: (config: ConfigService): string | null =>
        config.get<string>("STORAGE_BUCKET") ?? null,
    },
    { provide: PRESIGN_URL, useValue: getSignedUrl },
    {
      provide: LOCAL_FILE_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): LocalFileOptions => ({
        // Relative to where the API runs: api/, for every npm script.
        root: resolve(config.get<string>("STORAGE_LOCAL_DIR", ".storage")),
        publicUrl:
          config.get<string>("STORAGE_LOCAL_PUBLIC_URL") ??
          `http://localhost:${config.get<number>("PORT", 4000)}/` +
            `${config.get<string>("API_GLOBAL_PREFIX", "api")}/storage`,
        // A signing key of its own, derived from a secret the API already
        // keeps, so there is nothing new to set.
        secret: createHmac("sha256", config.getOrThrow<string>("JWT_ACCESS_SECRET"))
          .update("farmclub local file links")
          .digest(),
      }),
    },
    S3FileStore,
    LocalFileStore,
    {
      provide: FILE_STORE,
      inject: [ConfigService, LocalFileStore, S3FileStore],
      useFactory: (config: ConfigService, local: LocalFileStore, s3: S3FileStore): FileStore =>
        config.get<StorageDriver>("STORAGE_DRIVER") === StorageDriver.S3 ? s3 : local,
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
