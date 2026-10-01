import { jest } from "@jest/globals";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { Request, Response } from "express";
import type { LocalFileStore } from "./drivers/local-file-store.js";
import type { FileStore } from "./file-store.js";
import { LocalFilesController } from "./local-files.controller.js";

const KEY = "lessons/l1/scenes/s1/video/f1.mp4";
const LINK = { expires: 1_790_000_000, signature: "signed" };

/*
  The local driver's HTTP side: storage's own URLs, which the browser uploads
  to and plays from. Each request is checked against its signed link before
  anything is read or written, and the routes exist only while the local
  driver is the one in use.
*/
describe("LocalFilesController", () => {
  let local: {
    verifyUpload: jest.Mock<LocalFileStore["verifyUpload"]>;
    verifyDownload: jest.Mock<LocalFileStore["verifyDownload"]>;
    receive: jest.Mock<LocalFileStore["receive"]>;
    inspect: jest.Mock<LocalFileStore["inspect"]>;
    folder: string;
  };
  let controller: LocalFilesController;

  beforeEach(() => {
    local = {
      verifyUpload: jest.fn<LocalFileStore["verifyUpload"]>(),
      verifyDownload: jest.fn<LocalFileStore["verifyDownload"]>(),
      receive: jest.fn<LocalFileStore["receive"]>().mockResolvedValue(undefined),
      inspect: jest.fn<LocalFileStore["inspect"]>().mockResolvedValue({ sizeBytes: 4, contentType: "video/mp4" }),
      folder: "/files",
    };
    const asLocal = local as unknown as LocalFileStore;
    // The local store is the one in use, as it is by default.
    controller = new LocalFilesController(asLocal, asLocal);
  });

  const upload = (headers: Record<string, string>) => ({ headers }) as unknown as Request;

  describe("upload", () => {
    it("checks the link against what is being sent, then keeps it", async () => {
      const request = upload({ "content-type": "video/mp4", "content-length": "4" });

      // Express 5 hands a wildcard over as its path segments.
      await controller.upload(KEY.split("/"), LINK, request);

      expect(local.verifyUpload).toHaveBeenCalledWith(KEY, LINK, "video/mp4", 4);
      expect(local.receive).toHaveBeenCalledWith(KEY, request, 4, "video/mp4");
    });

    it("keeps nothing when the link does not fit", async () => {
      local.verifyUpload.mockImplementation(() => {
        throw new ForbiddenException({ code: "SIGNATURE_MISMATCH" });
      });

      await expect(
        controller.upload(KEY, LINK, upload({ "content-type": "video/webm", "content-length": "4" })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(local.receive).not.toHaveBeenCalled();
    });
  });

  describe("download", () => {
    it("checks the link, then sends the file from the folder as the type it was uploaded as", async () => {
      const response = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
      };

      await controller.download(KEY.split("/"), LINK, response as unknown as Response);

      expect(local.verifyDownload).toHaveBeenCalledWith(KEY, LINK);
      expect(response.setHeader).toHaveBeenCalledWith("Content-Type", "video/mp4");
      expect(response.sendFile).toHaveBeenCalledWith(
        KEY,
        expect.objectContaining({ root: "/files", dotfiles: "deny" }),
        expect.any(Function),
      );
    });

    it("is not found when nothing was uploaded there", async () => {
      local.inspect.mockResolvedValue(null);

      await expect(
        controller.download(KEY, LINK, { setHeader: jest.fn(), sendFile: jest.fn() } as unknown as Response),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it("is not there at all while another driver is in use", async () => {
    const other = new LocalFilesController({} as FileStore, local as unknown as LocalFileStore);

    await expect(
      other.upload(KEY, LINK, upload({ "content-type": "video/mp4", "content-length": "4" })),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(other.download(KEY, LINK, {} as Response)).rejects.toBeInstanceOf(NotFoundException);
    expect(local.verifyUpload).not.toHaveBeenCalled();
    expect(local.verifyDownload).not.toHaveBeenCalled();
  });
});
