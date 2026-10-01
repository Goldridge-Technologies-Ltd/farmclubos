import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { Inject, Injectable } from "@nestjs/common";
import type { FileStore, StoredFile, UploadTicket } from "../file-store.js";
import {
  OBJECT_STORE,
  PRESIGN_URL,
  STORAGE_BUCKET,
  type ObjectStore,
  type PresignUrl,
} from "../storage.tokens.js";

/** How long an upload link works: long enough to send a large video. */
const UPLOAD_LINK_SECONDS = 15 * 60;

/** How long a download link works, counted from the top of the hour. */
const DOWNLOAD_LINK_SECONDS = 2 * 60 * 60;

/*
  S3-compatible storage for lesson media: Cloudflare R2 in production, RustFS
  locally — anything that speaks S3. STORAGE_DRIVER=s3 chooses it.

  The bucket is private. Files go in and come out through signed links, so a
  video travels between the browser and storage directly, never through this
  API or the web app, and a link stops working when it expires.

  Nest constructs it whichever driver is chosen, as it does both mail
  transports; the client is null unless the S3 settings are present, and
  validation requires them before this driver can be chosen.
*/
@Injectable()
export class S3FileStore implements FileStore {
  constructor(
    @Inject(OBJECT_STORE) private readonly store: ObjectStore | null,
    @Inject(STORAGE_BUCKET) private readonly bucket: string | null,
    @Inject(PRESIGN_URL) private readonly presign: PresignUrl,
  ) {}

  async signUpload(key: string, contentType: string, sizeBytes: number): Promise<UploadTicket> {
    const { store, bucket } = this.ready();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: sizeBytes,
    });

    const url = await this.presign(store as S3Client, command, {
      expiresIn: UPLOAD_LINK_SECONDS,
      signableHeaders: new Set(["content-type", "content-length"]),
    });

    return {
      url,
      headers: { "Content-Type": contentType },
      expiresAt: new Date(Date.now() + UPLOAD_LINK_SECONDS * 1000),
    };
  }

  /**
   * Signed as of the top of the hour, so the same file gets the same link for
   * that hour, and valid for two hours from then.
   */
  async signDownload(key: string): Promise<string> {
    const { store, bucket } = this.ready();
    const signingDate = new Date();
    signingDate.setUTCMinutes(0, 0, 0);

    return this.presign(store as S3Client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: DOWNLOAD_LINK_SECONDS,
      signingDate,
    });
  }

  async inspect(key: string): Promise<StoredFile | null> {
    const { store, bucket } = this.ready();

    try {
      const head = await store.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

      return { sizeBytes: head.ContentLength ?? 0, contentType: head.ContentType ?? null };
    } catch (error) {
      if (statusOf(error) === 404) {
        return null;
      }

      throw error;
    }
  }

  async readText(key: string): Promise<string> {
    const { store, bucket } = this.ready();
    const object = await store.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    return (await object.Body?.transformToString("utf-8")) ?? "";
  }

  async remove(key: string): Promise<void> {
    const { store, bucket } = this.ready();

    await store.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  private ready(): { store: ObjectStore; bucket: string } {
    if (!this.store || !this.bucket) {
      throw new Error(
        "S3 storage is not set up: STORAGE_DRIVER=s3 needs STORAGE_ENDPOINT, " +
          "STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY",
      );
    }

    return { store: this.store, bucket: this.bucket };
  }
}

function statusOf(error: unknown): number | undefined {
  return (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
}
