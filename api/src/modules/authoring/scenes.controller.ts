import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { PlatformRoles } from "../../common/decorators/roles.decorator.js";
import type { AuthoringSceneView, LessonPreviewView, UploadTicketView } from "./authoring.types.js";
import { MoveDto } from "./dto/curriculum-request.dto.js";
import { CreateSceneDto, UpdateSceneDto, UploadRequestDto } from "./dto/scene-request.dto.js";
import {
  AuthoringSceneDto,
  LessonPreviewDto,
  RemovedSceneDto,
  UploadTicketDto,
} from "./dto/scene-response.dto.js";
import { ScenesService } from "./scenes.service.js";

const UNAUTHORIZED = { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." };
const FORBIDDEN = {
  status: HttpStatus.FORBIDDEN,
  description: "INSUFFICIENT_ROLE: only platform administrators and content managers.",
};
const NOT_FOUND = { status: HttpStatus.NOT_FOUND, description: "NOT_FOUND." };
const VALIDATION = { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED." };

/*
  The scenes inside a lesson, and a video scene's files.

  Uploading is two calls around the browser's own PUT to storage: ask for an
  upload link, send the file there, then finish the upload so the API can
  check what arrived before attaching it. No file passes through the API.
*/
@ApiTags("authoring")
@ApiBearerAuth()
@PlatformRoles("PLATFORM_ADMIN", "CONTENT_MANAGER")
@Controller("authoring")
export class ScenesController {
  constructor(private readonly scenes: ScenesService) {}

  @Post("lessons/:lessonId/scenes")
  @CustomMessage("Scene added")
  @ApiOperation({
    summary: "Add a scene to a lesson",
    description:
      "A VIDEO scene carries a video and a still image, and captions if the content team has " +
      "them; a NOTES scene carries text.",
  })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.CREATED, description: "Added.", type: AuthoringSceneDto })
  @ApiErrors(VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  createScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() body: CreateSceneDto,
  ): Promise<AuthoringSceneView> {
    return this.scenes.createScene(user, lessonId, body);
  }

  @Get("lessons/:lessonId/preview")
  @CustomMessage("Lesson preview loaded")
  @ApiOperation({
    summary: "A whole lesson as learners will see it, scene by scene",
    description:
      "Every scene in learners' order, with signed links to its files. Unlike a learner's view, " +
      "it keeps the scenes learners would not see yet, each listing what it still needs, and " +
      "gives a video before its still image is added. Nothing is recorded.",
  })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "The lesson.", type: LessonPreviewDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  previewLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ): Promise<LessonPreviewView> {
    return this.scenes.previewLesson(user, lessonId);
  }

  @Get("scenes/:sceneId")
  @CustomMessage("Scene loaded")
  @ApiOperation({ summary: "A scene, its files with signed links, and what it still needs" })
  @ApiParam({ name: "sceneId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "The scene.", type: AuthoringSceneDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  getScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sceneId", ParseUUIDPipe) sceneId: string,
  ): Promise<AuthoringSceneView> {
    return this.scenes.getScene(user, sceneId);
  }

  @Patch("scenes/:sceneId")
  @CustomMessage("Scene updated")
  @ApiOperation({ summary: "Change a scene's title or text" })
  @ApiParam({ name: "sceneId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Updated.", type: AuthoringSceneDto })
  @ApiErrors(VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  updateScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sceneId", ParseUUIDPipe) sceneId: string,
    @Body() body: UpdateSceneDto,
  ): Promise<AuthoringSceneView> {
    return this.scenes.updateScene(user, sceneId, body);
  }

  @Post("scenes/:sceneId/move")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Scene moved")
  @ApiOperation({ summary: "Move a scene up or down its lesson" })
  @ApiParam({ name: "sceneId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Moved.", type: AuthoringSceneDto })
  @ApiErrors(VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  moveScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sceneId", ParseUUIDPipe) sceneId: string,
    @Body() body: MoveDto,
  ): Promise<AuthoringSceneView> {
    return this.scenes.moveScene(user, sceneId, body.direction);
  }

  @Delete("scenes/:sceneId")
  @CustomMessage("Scene removed")
  @ApiOperation({
    summary: "Remove a scene",
    description: "Its files are deleted from storage, and learners' records of having seen it go with it.",
  })
  @ApiParam({ name: "sceneId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Removed.", type: RemovedSceneDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  removeScene(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sceneId", ParseUUIDPipe) sceneId: string,
  ): Promise<{ id: string }> {
    return this.scenes.removeScene(user, sceneId);
  }

  @Post("scenes/:sceneId/uploads")
  @CustomMessage("Upload ready")
  @ApiOperation({
    summary: "Get a link to upload one of a video scene's files to",
    description:
      "PUT the file to the link with exactly the headers given, within fifteen minutes, then " +
      "finish the upload. VIDEO takes an MP4 up to 1 GB, CAPTIONS WebVTT up to 1 MB, POSTER a " +
      "JPG, PNG or WebP up to 5 MB.",
  })
  @ApiParam({ name: "sceneId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.CREATED, description: "Signed.", type: UploadTicketDto })
  @ApiErrors(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "VALIDATION_FAILED, WRONG_SCENE_KIND, FILE_TYPE or FILE_TOO_LARGE.",
    },
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
  )
  requestUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sceneId", ParseUUIDPipe) sceneId: string,
    @Body() body: UploadRequestDto,
  ): Promise<UploadTicketView> {
    return this.scenes.requestUpload(user, sceneId, body);
  }

  @Post("uploads/:assetId/complete")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("File uploaded")
  @ApiOperation({
    summary: "Finish an upload",
    description:
      "Checks the file arrived as signed — and that captions are WebVTT — then attaches it to " +
      "its scene, replacing and deleting the one before. Finishing twice is not an error.",
  })
  @ApiParam({ name: "assetId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Attached.", type: AuthoringSceneDto })
  @ApiErrors(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "UPLOAD_MISSING, UPLOAD_MISMATCH or CAPTIONS_INVALID.",
    },
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
  )
  completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetId", ParseUUIDPipe) assetId: string,
  ): Promise<AuthoringSceneView> {
    return this.scenes.completeUpload(user, assetId);
  }
}
