import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "./storage.service.js";
import { OBJECT_STORE, PRESIGN_URL, STORAGE_BUCKET } from "./storage.tokens.js";

/*
  Infrastructure module: global, exports its service, imported once in
  AppModule (api/AGENTS.md).

  Without the STORAGE_* settings the client is null and StorageService answers
  503 STORAGE_UNAVAILABLE — the rest of the API still runs. Environment
  validation makes them required in production.
*/
@Global()
@Module({
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
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
