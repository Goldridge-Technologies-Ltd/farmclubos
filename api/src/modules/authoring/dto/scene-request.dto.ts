import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import { Trim } from "../../../common/decorators/trim.decorator.js";
import { LessonSceneKind, MediaPurpose } from "../../../generated/prisma/enums.js";

export class CreateSceneDto {
  @ApiProperty({ enum: LessonSceneKind, enumName: "LessonSceneKind" })
  @IsEnum(LessonSceneKind)
  kind: LessonSceneKind;

  @ApiProperty({ example: "Four flows", maxLength: 200 })
  @Trim()
  @IsString()
  @Length(1, 200)
  title: string;
}

/** Send only what changes. A null or empty body clears it. */
export class UpdateSceneDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @Trim()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 50000,
    description: "In the notes' formatting syntax: headings, bold, italic, lists and links.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  body?: string | null;
}

export class UploadRequestDto {
  @ApiProperty({ enum: MediaPurpose, enumName: "MediaPurpose" })
  @IsEnum(MediaPurpose)
  purpose: MediaPurpose;

  @ApiProperty({ example: "four-flows.mp4", description: "Shown to the content team only." })
  @Trim()
  @IsString()
  @Length(1, 255)
  fileName: string;

  @ApiProperty({ example: "video/mp4" })
  @IsString()
  @Length(1, 100)
  contentType: string;

  @ApiProperty({ example: 52428800, description: "Exact size in bytes; the upload link is signed for it." })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  sizeBytes: number;
}
