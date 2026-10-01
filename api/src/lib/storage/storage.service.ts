import { Inject, Injectable } from "@nestjs/common";
import { FILE_STORE, type FileStore, type StoredFile, type UploadTicket } from "./file-store.js";

export type { StoredFile, UploadTicket } from "./file-store.js";

/*
  Lesson media storage, as the rest of the API sees it. Each request goes to
  the store STORAGE_DRIVER chose at boot, a folder on this machine or
  S3-compatible storage, and nothing outside src/lib/storage knows which.
*/
@Injectable()
export class StorageService implements FileStore {
  constructor(@Inject(FILE_STORE) private readonly store: FileStore) {}

  signUpload(key: string, contentType: string, sizeBytes: number): Promise<UploadTicket> {
    return this.store.signUpload(key, contentType, sizeBytes);
  }

  signDownload(key: string): Promise<string> {
    return this.store.signDownload(key);
  }

  inspect(key: string): Promise<StoredFile | null> {
    return this.store.inspect(key);
  }

  readText(key: string): Promise<string> {
    return this.store.readText(key);
  }

  remove(key: string): Promise<void> {
    return this.store.remove(key);
  }
}
