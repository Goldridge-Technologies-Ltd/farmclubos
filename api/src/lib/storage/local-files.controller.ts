import {
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { Public } from "../../common/decorators/public.decorator.js";
import { LocalFileStore } from "./drivers/local-file-store.js";
import { SignedLinkDto } from "./dto/signed-link.dto.js";
import { FILE_STORE, type FileStore } from "./file-store.js";

/*
  The local driver's storage URLs: what the browser uploads a lesson's files
  to and plays them from, as it would S3's. Public, because a signed link is
  its own permission, and left out of the API's documentation, because only a
  link the API made ever reaches it. With another driver in use, nothing is
  here at all.
*/
@ApiExcludeController()
@Public()
@Controller("storage")
export class LocalFilesController {
  constructor(
    @Inject(FILE_STORE) private readonly store: FileStore,
    private readonly local: LocalFileStore,
  ) {}

  @Put("*key")
  @HttpCode(200)
  async upload(
    @Param("key") segments: string | string[],
    @Query() link: SignedLinkDto,
    @Req() request: Request,
  ): Promise<void> {
    const key = this.keyOf(segments);
    const contentType = request.headers["content-type"];
    const sizeBytes = Number(request.headers["content-length"]);

    this.local.verifyUpload(key, link, contentType, sizeBytes);
    await this.local.receive(key, request, sizeBytes, contentType ?? "");
  }

  @Get("*key")
  async download(
    @Param("key") segments: string | string[],
    @Query() link: SignedLinkDto,
    @Res() response: Response,
  ): Promise<void> {
    const key = this.keyOf(segments);

    this.local.verifyDownload(key, link);

    const file = await this.local.inspect(key);

    if (!file) {
      throw new NotFoundException({ code: "FILE_NOT_FOUND", message: "There is no file here." });
    }

    if (file.contentType) {
      response.setHeader("Content-Type", file.contentType);
    }

    // Express answers byte ranges, so a player can seek, and conditional requests.
    response.sendFile(
      key,
      {
        root: this.local.folder,
        dotfiles: "deny",
        cacheControl: false,
        // The link stays the same, and valid, for the rest of the hour.
        headers: { "Cache-Control": "private, max-age=3600" },
      },
      (error) => {
        if (error && !response.headersSent) {
          response.status(404).end();
        }
      },
    );
  }

  /** The file's key, once it is clear the local driver is the one in use. */
  private keyOf(segments: string | string[]): string {
    if (this.store !== this.local) {
      throw new NotFoundException();
    }

    // Express 5 hands a wildcard over as its path segments.
    return Array.isArray(segments) ? segments.join("/") : segments;
  }
}
