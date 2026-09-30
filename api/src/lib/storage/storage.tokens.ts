import type { S3Client } from "@aws-sdk/client-s3";
import type { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/*
  What StorageService is given, as injection tokens, so a test can hand it a
  stand-in for the S3 client and the presigner instead of reaching the network.
*/

/** The S3 client, or null when storage is not set up. */
export const OBJECT_STORE = Symbol("OBJECT_STORE");

/** The bucket every file lives in, or null when storage is not set up. */
export const STORAGE_BUCKET = Symbol("STORAGE_BUCKET");

/** Signs a request into a URL someone else can use: `getSignedUrl`. */
export const PRESIGN_URL = Symbol("PRESIGN_URL");

export type ObjectStore = Pick<S3Client, "send">;
export type PresignUrl = typeof getSignedUrl;
