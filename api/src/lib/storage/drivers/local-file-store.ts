import { BadRequestException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { Transform, type Readable, type TransformCallback } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { FileStore, StoredFile, UploadTicket } from "../file-store.js";

/** How long an upload link works: long enough to send a large video. */
const UPLOAD_LINK_SECONDS = 15 * 60;

/** How long a download link works, counted from the top of the hour. */
const DOWNLOAD_LINK_SECONDS = 2 * 60 * 60;

const HOUR_SECONDS = 60 * 60;

/** Where the type each file arrived as is kept. No key can reach it. */
const META_FOLDER = ".meta";

export type LocalFileOptions = {
  /** The folder the files are kept in. */
  root: string;
  /** Where the browser reaches them: this API's /storage route. */
  publicUrl: string;
  /** Signs links. Derived from the access-token secret, so never stored. */
  secret: string | Buffer;
};

export const LOCAL_FILE_OPTIONS = Symbol("LOCAL_FILE_OPTIONS");

/** What a signed link carries in its query. */
export type SignedLink = { expires: number; signature: string };

/*
  Lesson media in a folder on this machine, for development without Docker or
  a cloud account. The API serves the files itself (LocalFilesController) and
  behaves as S3 storage does wherever it shows: links are signed and expire,
  an upload's type and exact size are bound into its signature, and the type a
  file arrived as is recorded beside it, as S3 keeps an object's metadata. The
  rest of the API and the web app cannot tell the two apart.

  Production refuses this driver (src/config/env.validation.ts).
*/
@Injectable()
export class LocalFileStore implements FileStore {
  private readonly root: string;
  private readonly publicUrl: string;

  constructor(@Inject(LOCAL_FILE_OPTIONS) private readonly options: LocalFileOptions) {
    this.root = resolve(options.root);
    this.publicUrl = options.publicUrl.replace(/\/+$/, "");
  }

  signUpload(key: string, contentType: string, sizeBytes: number): Promise<UploadTicket> {
    const expiresAt = new Date(Date.now() + UPLOAD_LINK_SECONDS * 1000);
    const expires = Math.floor(expiresAt.getTime() / 1000);

    return Promise.resolve({
      url: this.linkTo(key, expires, this.sign("PUT", key, expires, contentType, sizeBytes)),
      headers: { "Content-Type": contentType },
      expiresAt,
    });
  }

  signDownload(key: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expires = now - (now % HOUR_SECONDS) + DOWNLOAD_LINK_SECONDS;

    return Promise.resolve(this.linkTo(key, expires, this.sign("GET", key, expires)));
  }

  /** Throws 403 unless the link was signed for exactly this upload, and is current. */
  verifyUpload(
    key: string,
    link: SignedLink,
    contentType: string | undefined,
    sizeBytes: number,
  ): void {
    this.verify(link, this.sign("PUT", key, link.expires, contentType ?? "", sizeBytes));
  }

  /** Throws 403 unless the link was signed for reading this file, and is current. */
  verifyDownload(key: string, link: SignedLink): void {
    this.verify(link, this.sign("GET", key, link.expires));
  }

  /**
   * Writes an upload. It goes to a temporary file first and takes its key's
   * place only once exactly the signed number of bytes has arrived, so a
   * broken or oversized upload leaves nothing behind.
   */
  async receive(
    key: string,
    body: Readable,
    sizeBytes: number,
    contentType: string,
  ): Promise<void> {
    const target = this.pathOf(key);
    const partial = `${target}.${randomUUID()}.part`;
    let received = 0;

    await mkdir(dirname(target), { recursive: true });

    try {
      await pipeline(
        body,
        new Transform({
          transform(chunk: Buffer, _encoding: BufferEncoding, done: TransformCallback) {
            received += chunk.length;
            done(received > sizeBytes ? sizeMismatch() : null, chunk);
          },
        }),
        createWriteStream(partial, { flags: "wx" }),
      );

      if (received !== sizeBytes) {
        throw sizeMismatch();
      }
    } catch (error) {
      await rm(partial, { force: true });
      throw error;
    }

    await rename(partial, target);
    await this.writeMeta(key, { contentType });
  }

  async inspect(key: string): Promise<StoredFile | null> {
    try {
      const { size } = await stat(this.pathOf(key));

      return { sizeBytes: size, contentType: await this.contentTypeOf(key) };
    } catch (error) {
      if (isMissing(error)) {
        return null;
      }

      throw error;
    }
  }

  readText(key: string): Promise<string> {
    return readFile(this.pathOf(key), "utf8");
  }

  async remove(key: string): Promise<void> {
    await rm(this.pathOf(key), { force: true });
    await rm(this.metaPathOf(key), { force: true });
  }

  /** The type a file was uploaded as; null if unknown. */
  private async contentTypeOf(key: string): Promise<string | null> {
    try {
      const meta = JSON.parse(await readFile(this.metaPathOf(key), "utf8")) as {
        contentType?: string;
      };

      return meta.contentType ?? null;
    } catch (error) {
      if (isMissing(error)) {
        return null;
      }

      throw error;
    }
  }

  /** The folder files are served from. */
  get folder(): string {
    return this.root;
  }

  /**
   * A key's file. The API makes every key, but a key still never leads out of
   * the folder or into the type records, whatever it holds.
   */
  pathOf(key: string): string {
    const segments = key.split("/");
    const path = resolve(this.root, key);

    if (
      !key ||
      isAbsolute(key) ||
      key.includes("\\") ||
      segments.some((segment) => segment === "" || segment.startsWith(".")) ||
      !path.startsWith(this.root + sep)
    ) {
      throw new BadRequestException({
        code: "INVALID_KEY",
        message: "That is not a key a file can have.",
      });
    }

    return path;
  }

  private metaPathOf(key: string): string {
    this.pathOf(key);

    return join(this.root, META_FOLDER, `${key}.json`);
  }

  private async writeMeta(key: string, meta: { contentType: string }): Promise<void> {
    const path = this.metaPathOf(key);

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(meta));
  }

  /** The method, key, expiry and, for an upload, type and size, signed together. */
  private sign(
    method: "GET" | "PUT",
    key: string,
    expires: number,
    contentType = "",
    sizeBytes: number | "" = "",
  ): string {
    return createHmac("sha256", this.options.secret)
      .update([method, key, expires, contentType, sizeBytes].join("\n"))
      .digest("base64url");
  }

  private verify(link: SignedLink, expected: string): void {
    const given = Buffer.from(String(link.signature));
    const wanted = Buffer.from(expected);

    if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
      throw new ForbiddenException({
        code: "SIGNATURE_MISMATCH",
        message: "This link was not made for this request.",
      });
    }

    if (link.expires * 1000 < Date.now()) {
      throw new ForbiddenException({ code: "LINK_EXPIRED", message: "This link has expired." });
    }
  }

  private linkTo(key: string, expires: number, signature: string): string {
    const path = key.split("/").map(encodeURIComponent).join("/");

    return `${this.publicUrl}/${path}?expires=${expires}&signature=${signature}`;
  }
}

function sizeMismatch(): BadRequestException {
  return new BadRequestException({
    code: "UPLOAD_SIZE_MISMATCH",
    message: "The file sent is not the size its upload link was made for.",
  });
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === "ENOENT";
}
