import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from "class-validator";
import { DeliveryMode } from "../../../generated/prisma/enums.js";

export class CreateCohortDto {
  @ApiProperty({ example: "agricultural-entrepreneurship-foundation" })
  @IsString()
  @Length(1, 200)
  pathwaySlug: string;

  @ApiProperty({ example: "September intake" })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiPropertyOptional({ description: "The institution's own code for this intake." })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @ApiPropertyOptional({ enum: DeliveryMode, enumName: "DeliveryMode", default: "BLENDED" })
  @IsOptional()
  @IsEnum(DeliveryMode)
  deliveryMode?: DeliveryMode;

  @ApiPropertyOptional({ format: "date", example: "2026-09-01" })
  @IsOptional()
  @IsDateString()
  startsOn?: string;

  @ApiPropertyOptional({ format: "date" })
  @IsOptional()
  @IsDateString()
  endsOn?: string;
}

export class EnrolDto {
  @ApiProperty({ example: "ada@example.com" })
  @IsEmail()
  email: string;
}

/*
  A change to a cohort. Send only what changes; `null` clears the code or a
  date. There is no pathway field, and the global pipe refuses fields it does
  not know — so a pathway cannot be changed here, which is the point: every
  learner's progress hangs off it.
*/
export class UpdateCohortDto {
  @ApiPropertyOptional({ example: "September intake" })
  // Validated whenever it is sent, null included: a cohort must keep a name.
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Length(1, 200)
  name?: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: "null clears it." })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string | null;

  @ApiPropertyOptional({ enum: DeliveryMode, enumName: "DeliveryMode" })
  @IsOptional()
  @IsEnum(DeliveryMode)
  deliveryMode?: DeliveryMode;

  @ApiPropertyOptional({ type: String, format: "date", nullable: true, description: "null clears it." })
  @IsOptional()
  @IsDateString()
  startsOn?: string | null;

  @ApiPropertyOptional({ type: String, format: "date", nullable: true, description: "null clears it." })
  @IsOptional()
  @IsDateString()
  endsOn?: string | null;
}
