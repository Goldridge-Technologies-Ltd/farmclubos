/*
  Creates the lesson-media bucket when it is missing, and lets the web app use
  it from the browser: uploads go straight from the browser to storage, and a
  video's captions load from it across origins. Safe to run again.

    npm run storage:setup --workspace api

  Reads STORAGE_* and WEBAPP_URL from api/.env, plus STORAGE_CORS_ORIGINS
  (comma-separated) for any other address the web app is served from.

  Against Cloudflare R2 this needs a token with Admin Read & Write; the API
  itself only needs Object Read & Write. Or set the same rule in the R2
  dashboard under the bucket's Settings → CORS policy.
*/
import "dotenv/config";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const endpoint = process.env.STORAGE_ENDPOINT;
const bucket = process.env.STORAGE_BUCKET;
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
  if ((process.env.STORAGE_DRIVER ?? "local") === "local") {
    console.log(
      "STORAGE_DRIVER is local, which needs no setup: files go in " +
        `api/${process.env.STORAGE_LOCAL_DIR ?? ".storage"}. This script sets up an S3 bucket, ` +
        "RustFS or R2, once its STORAGE_* settings are in api/.env.",
    );
    process.exit(0);
  }

  console.error(
    "Set STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID and " +
      "STORAGE_SECRET_ACCESS_KEY in api/.env first.",
  );
  process.exit(1);
}

const origins = [process.env.WEBAPP_URL ?? "http://localhost:3001"]
  .concat((process.env.STORAGE_CORS_ORIGINS ?? "").split(","))
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const client = new S3Client({
  endpoint,
  region: process.env.STORAGE_REGION ?? "auto",
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

try {
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log(`Bucket ${bucket} exists.`);
} catch {
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`Created bucket ${bucket}.`);
}

await client.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: origins,
          // PUT for uploads; GET and HEAD for playing a video and its captions.
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedHeaders: ["content-type"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);
console.log(`Allowed ${origins.join(", ")} to upload to it and play from it.`);
