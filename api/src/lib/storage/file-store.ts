/** A link the browser uploads one file to, with the headers it must send. */
export type UploadTicket = {
  url: string;
  /** Headers the upload must carry exactly, since they were signed. */
  headers: Record<string, string>;
  expiresAt: Date;
};

/** What storage holds at a key: the size that arrived, and the type it came as. */
export type StoredFile = { sizeBytes: number; contentType: string | null };

/**
 * Where lesson media is kept. The implementation is chosen once, at boot, from
 * STORAGE_DRIVER: `local`, a folder on this machine, in development; `s3`,
 * Cloudflare R2 or RustFS, otherwise.
 */
export interface FileStore {
  /**
   * A link the browser uploads one file to. Its type and exact size are part
   * of the signature, so the upload cannot swap in something else or larger.
   */
  signUpload(key: string, contentType: string, sizeBytes: number): Promise<UploadTicket>;

  /**
   * A link to play or show a file. The same file gets the same link for the
   * rest of the hour, so a browser can cache it, and the link always has at
   * least an hour left.
   */
  signDownload(key: string): Promise<string>;

  /** What storage holds at a key, or null when nothing was uploaded there. */
  inspect(key: string): Promise<StoredFile | null>;

  /** A small text file's contents, such as a captions file. */
  readText(key: string): Promise<string>;

  /** Deletes a file. Deleting one that is not there is not an error. */
  remove(key: string): Promise<void>;
}

export const FILE_STORE = Symbol("FILE_STORE");
