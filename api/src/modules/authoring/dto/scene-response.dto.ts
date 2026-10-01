import { ApiProperty } from "@nestjs/swagger";
import { LessonSceneKind, PublishStatus } from "../../../generated/prisma/enums.js";
import type { SceneGap } from "../../academy/scene-readiness.js";
import type {
  AuthoringSceneView,
  MediaFileView,
  UploadTicketView,
} from "../authoring.types.js";
import { PathwayRefDto } from "./curriculum-response.dto.js";

export class MediaFileDto implements MediaFileView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "four-flows.mp4" })
  fileName: string;

  @ApiProperty({ example: "video/mp4" })
  contentType: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty({ description: "A signed link to play or show it. It expires; never store it." })
  url: string;
}

class SceneLessonDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: PublishStatus, enumName: "PublishStatus" })
  status: PublishStatus;
}

class SceneModuleDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  title: string;
}

export class AuthoringSceneDto implements AuthoringSceneView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ enum: LessonSceneKind, enumName: "LessonSceneKind" })
  kind: LessonSceneKind;

  @ApiProperty()
  sequence: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: String, nullable: true })
  body: string | null;

  @ApiProperty({ type: String, nullable: true, description: "Made from the captions file." })
  transcript: string | null;

  @ApiProperty({ enum: ["VIDEO", "CAPTIONS", "POSTER", "BODY"], isArray: true })
  gaps: SceneGap[];

  @ApiProperty({ type: SceneLessonDto })
  lesson: SceneLessonDto;

  @ApiProperty({ type: SceneModuleDto })
  module: SceneModuleDto;

  @ApiProperty({ type: PathwayRefDto })
  pathway: PathwayRefDto;

  @ApiProperty({ type: MediaFileDto, nullable: true })
  video: MediaFileDto | null;

  @ApiProperty({ type: MediaFileDto, nullable: true })
  captions: MediaFileDto | null;

  @ApiProperty({ type: MediaFileDto, nullable: true })
  poster: MediaFileDto | null;
}

export class UploadTicketDto implements UploadTicketView {
  @ApiProperty({ format: "uuid", description: "Finish the upload with this once the file is sent." })
  assetId: string;

  @ApiProperty({ description: "Send the file here, straight to storage." })
  url: string;

  @ApiProperty({ enum: ["PUT"] })
  method: "PUT";

  @ApiProperty({
    type: "object",
    additionalProperties: { type: "string" },
    example: { "Content-Type": "video/mp4" },
    description: "Send exactly these: they are part of the signature.",
  })
  headers: Record<string, string>;

  @ApiProperty()
  expiresAt: Date;
}

export class RemovedSceneDto {
  @ApiProperty({ format: "uuid" })
  id: string;
}
