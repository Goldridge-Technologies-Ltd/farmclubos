import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, Length } from "class-validator";
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
