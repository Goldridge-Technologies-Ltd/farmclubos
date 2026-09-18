import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Trim } from "../../../common/decorators/trim.decorator.js";
import {
  EducationLevel,
  EmploymentStatus,
  Gender,
} from "../../../generated/prisma/enums.js";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../auth/password.constants.js";

/*
  Optional fields accept null to clear them. `state` is deliberately absent: a
  learner's stage is set by their institution, not by the learner.
*/
export class UpdateLearnerProfileDto {
  @ApiPropertyOptional({ type: String, nullable: true, example: "+234 800 000 0000" })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, format: "date", example: "2004-03-09" })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Length(10, 10)
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ enum: Gender, enumName: "Gender", nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null;

  @ApiPropertyOptional({ enum: EducationLevel, enumName: "EducationLevel", nullable: true })
  @IsOptional()
  @IsEnum(EducationLevel)
  educationLevel?: EducationLevel | null;

  @ApiPropertyOptional({ enum: EmploymentStatus, enumName: "EmploymentStatus", nullable: true })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  location?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(1000)
  goals?: string | null;
}

export class UpdateProfileDto {
  // Names can be changed but never cleared, so null is a validation error.
  @ApiPropertyOptional({ example: "Tunde" })
  @ValidateIf((_, value) => value !== undefined)
  @Trim()
  @IsString()
  @Length(1, 80)
  firstName?: string;

  @ApiPropertyOptional({ example: "Bello" })
  @ValidateIf((_, value) => value !== undefined)
  @Trim()
  @IsString()
  @Length(1, 80)
  lastName?: string;

  @ApiPropertyOptional({
    type: () => UpdateLearnerProfileDto,
    description: "Learners only.",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateLearnerProfileDto)
  learnerProfile?: UpdateLearnerProfileDto;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH)
  currentPassword: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  newPassword: string;
}
