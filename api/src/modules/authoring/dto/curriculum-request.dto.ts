import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsIn, IsOptional, IsString, Length, MaxLength, ValidateIf } from "class-validator";
import { Trim } from "../../../common/decorators/trim.decorator.js";
import { PathwayLevel } from "../../../generated/prisma/enums.js";
import type { MoveDirection } from "../authoring.types.js";

/** A new pathway: a title and a summary, and optionally a description and a level. */
export class CreatePathwayDto {
  @ApiProperty({ example: "Agricultural Entrepreneurship Foundation", maxLength: 200 })
  @Trim()
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({ maxLength: 1000, description: "A sentence or two, shown in the catalogue." })
  @Trim()
  @IsString()
  @Length(1, 1000)
  summary: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @ApiPropertyOptional({ enum: PathwayLevel, enumName: "PathwayLevel", default: "FOUNDATION" })
  @IsOptional()
  @IsEnum(PathwayLevel)
  level?: PathwayLevel;
}

/**
 * Send only what changes. The title and summary cannot be cleared; a null or
 * empty description clears it.
 */
export class UpdatePathwayDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @Trim()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @Trim()
  @IsString()
  @Length(1, 1000)
  summary?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @ApiPropertyOptional({ enum: PathwayLevel, enumName: "PathwayLevel" })
  @IsOptional()
  @IsEnum(PathwayLevel)
  level?: PathwayLevel;
}

/** A new module or lesson: a title, and optionally a line about it. */
export class CreateCurriculumItemDto {
  @ApiProperty({ example: "Enterprise Mindset", maxLength: 200 })
  @Trim()
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string | null;
}

/** Send only what changes. A null or empty summary clears it; a title cannot be cleared. */
export class UpdateCurriculumItemDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @Trim()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string | null;
}

export class MoveDto {
  @ApiProperty({ enum: ["UP", "DOWN"], description: "Swap with the item before or after it." })
  @IsIn(["UP", "DOWN"])
  direction: MoveDirection;
}
