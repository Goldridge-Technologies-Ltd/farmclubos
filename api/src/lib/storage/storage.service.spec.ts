import { jest } from "@jest/globals";
import type { FileStore } from "./file-store.js";
import { StorageService } from "./storage.service.js";

/*
  StorageService is what the rest of the API injects. It hands each request to
  whichever store STORAGE_DRIVER chose, so callers never know which it is.
*/
describe("StorageService", () => {
  it("hands every request to the chosen store, unchanged", async () => {
    const ticket = { url: "https://files/u", headers: { "Content-Type": "video/mp4" }, expiresAt: new Date() };
    const store = {
      signUpload: jest.fn<FileStore["signUpload"]>().mockResolvedValue(ticket),
      signDownload: jest.fn<FileStore["signDownload"]>().mockResolvedValue("https://files/d"),
      inspect: jest.fn<FileStore["inspect"]>().mockResolvedValue({ sizeBytes: 4, contentType: "text/vtt" }),
      readText: jest.fn<FileStore["readText"]>().mockResolvedValue("WEBVTT"),
      remove: jest.fn<FileStore["remove"]>().mockResolvedValue(undefined),
    };
    const storage = new StorageService(store);

    await expect(storage.signUpload("k", "video/mp4", 4)).resolves.toBe(ticket);
    await expect(storage.signDownload("k")).resolves.toBe("https://files/d");
    await expect(storage.inspect("k")).resolves.toEqual({ sizeBytes: 4, contentType: "text/vtt" });
    await expect(storage.readText("k")).resolves.toBe("WEBVTT");
    await expect(storage.remove("k")).resolves.toBeUndefined();

    expect(store.signUpload).toHaveBeenCalledWith("k", "video/mp4", 4);
    for (const method of [store.signDownload, store.inspect, store.readText, store.remove]) {
      expect(method).toHaveBeenCalledWith("k");
    }
  });
});
