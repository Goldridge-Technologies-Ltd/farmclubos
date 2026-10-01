import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import {
  OBJECT_STORE,
  PRESIGN_URL,
  STORAGE_BUCKET,
  type ObjectStore,
  type PresignUrl,
} from "./storage.tokens.js";

/** How long an upload link works: long enough to send a large video. */
const UPLOAD_LINK_SECONDS = 15 * 60;

/** How long a download link works, counted from the top of the hour. */
const DOWNLOAD_LINK_SECONDS = 2 * 60 * 60;

export type UploadTicket = {
  url: string;
  /** Headers the upload must carry exactly, since they were signed. */
  headers: Record<string, string>;
  expiresAt: Date;
};

export type StoredFile = { sizeBytes: number; contentType: string | null };

/*
  File storage for lesson media: Cloudflare R2 in production, RustFS locally —
  anything that speaks S3.

  The bucket is private. Files go in and come out through signed links, so a
  video travels between the browser and storage directly, never through this
  API or the web app, and a link stops working when it expires.
*/
@Injectable()
export class StorageService {
  constructor(
    @Inject(OBJECT_STORE) private readonly store: ObjectStore | null,
    @Inject(STORAGE_BUCKET) private readonly bucket: string | null,
    @Inject(PRESIGN_URL) private readonly presign: PresignUrl,
  ) {}

  /** Whether storage is set up. Outside production it may not be. */
  get configured(): boolean {
    return this.store !== null && this.bucket !== null;
  }

  /**
   * A link the browser uploads one file to. Its type and exact size are part
   * of the signature, so the upload cannot swap in something else or larger.
   */
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
   * A link to play or show a file. Signed as of the top of the hour, so the
   * same file gets the same link for that hour and a browser can cache it,
   * and valid for two hours from then, so it never has less than one left.
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

  /** What storage holds at a key, or null when nothing was uploaded there. */
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

  /** A small text file's contents, such as a captions file. */
  async readText(key: string): Promise<string> {
    const { store, bucket } = this.ready();
    const object = await store.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    return (await object.Body?.transformToString("utf-8")) ?? "";
  }

  /** Deletes a file. Deleting one that is not there is not an error. */
  async remove(key: string): Promise<void> {
    const { store, bucket } = this.ready();

    await store.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  private ready(): { store: ObjectStore; bucket: string } {
    if (!this.store || !this.bucket) {
      throw new ServiceUnavailableException({
        code: "STORAGE_UNAVAILABLE",
        message: "File storage is not set up, so files cannot be uploaded or played.",
      });
    }

    return { store: this.store, bucket: this.bucket };
  }
}

function statusOf(error: unknown): number | undefined {
  return (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
}
