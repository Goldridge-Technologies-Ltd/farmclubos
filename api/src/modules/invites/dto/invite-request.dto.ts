import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";
import { Trim } from "../../../common/decorators/trim.decorator.js";
import { PaginationQueryDto } from "../../../common/http/pagination-query.dto.js";
import { InstitutionRole, InviteStatus } from "../../../generated/prisma/enums.js";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../auth/password.constants.js";

export class IssueInviteDto {
  @ApiProperty({ example: "learner@example.com" })
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ enum: InstitutionRole, enumName: "InstitutionRole" })
  @IsEnum(InstitutionRole)
  role: InstitutionRole;
}

export class InviteListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: InviteStatus,
    enumName: "InviteStatus",
    description: "PENDING excludes lapsed invites; EXPIRED includes them.",
  })
  @IsOptional()
  @IsEnum(InviteStatus)
  status?: InviteStatus;
}

export class InviteTokenDto {
  @ApiProperty({ description: "The token from the invitation link." })
  @IsString()
  @Length(20, 200)
  token: string;
}

export class AcceptInviteDto extends InviteTokenDto {
  @ApiProperty({ example: "Tunde" })
  @Trim()
  @IsString()
  @Length(1, 80)
  firstName: string;

  @ApiProperty({ example: "Bello" })
  @Trim()
  @IsString()
  @Length(1, 80)
  lastName: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}
