import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Length, MaxLength, ValidateIf } from "class-validator";
import { Trim } from "../../../common/decorators/trim.decorator.js";
import type { MoveDirection } from "../authoring.types.js";

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
