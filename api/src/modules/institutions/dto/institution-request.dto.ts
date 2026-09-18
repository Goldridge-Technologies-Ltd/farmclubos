import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from "class-validator";
import { Trim } from "../../../common/decorators/trim.decorator.js";
import { PaginationQueryDto } from "../../../common/http/pagination-query.dto.js";
import { InstitutionStatus, InstitutionType } from "../../../generated/prisma/enums.js";

export class CreateInstitutionDto {
  @ApiProperty({ example: "Greenfield Technical College" })
  @Trim()
  @IsString()
  @Length(2, 160)
  name: string;

  @ApiProperty({ enum: InstitutionType, enumName: "InstitutionType" })
  @IsEnum(InstitutionType)
  type: InstitutionType;

  @ApiProperty({ example: "office@greenfield.example.com" })
  @Trim()
  @IsEmail()
  @MaxLength(254)
  contactEmail: string;

  @ApiPropertyOptional({ example: "+234 800 000 0000" })
  @IsOptional()
  @Trim()
  @IsString()
  @Length(3, 40)
  contactPhone?: string;

  @ApiPropertyOptional({ example: "https://greenfield.example.com" })
  @IsOptional()
  @Trim()
  @IsUrl({ require_protocol: true })
  @MaxLength(300)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  addressLine?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  country?: string;
}

/**
 * Every field optional. `type` may only be changed by a platform admin, which
 * the service enforces; the slug never changes, so links stay stable.
 */
export class UpdateInstitutionDto extends PartialType(CreateInstitutionDto) {}

export class InstitutionListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InstitutionStatus, enumName: "InstitutionStatus" })
  @IsOptional()
  @IsEnum(InstitutionStatus)
  status?: InstitutionStatus;

  @ApiPropertyOptional({ description: "Matches anywhere in the name, ignoring case." })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  search?: string;
}
