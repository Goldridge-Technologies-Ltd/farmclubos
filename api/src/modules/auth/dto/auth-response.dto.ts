import { ApiProperty } from "@nestjs/swagger";
import { InstitutionRole, PlatformRole } from "../../../generated/prisma/enums.js";
import type {
  AuthSessionResult,
  MembershipSummary,
  SessionContext,
  SessionUser,
  SwitchedInstitution,
} from "../auth.types.js";

/*
  Swagger classes for the auth responses. Each implements the type the service
  returns, so the documentation cannot drift from what is actually sent.
*/

export class SessionUserDto implements SessionUser {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "ada.obi@example.com" })
  email: string;

  @ApiProperty({ example: "Ada" })
  firstName: string;

  @ApiProperty({ example: "Obi" })
  lastName: string;

  @ApiProperty({ enum: PlatformRole, enumName: "PlatformRole" })
  platformRole: PlatformRole;
}

export class MembershipSummaryDto implements MembershipSummary {
  @ApiProperty({ format: "uuid" })
  institutionId: string;

  @ApiProperty({ example: "Greenfield Technical College" })
  institutionName: string;

  @ApiProperty({ example: "greenfield-technical-college" })
  institutionSlug: string;

  @ApiProperty({ enum: InstitutionRole, enumName: "InstitutionRole" })
  role: InstitutionRole;

  @ApiProperty({
    description:
      "True for FARMCLUB's home for people learning on their own: show it as independent " +
      "learning, not as an institution.",
  })
  independentLearners: boolean;
}

export class SessionContextDto implements SessionContext {
  @ApiProperty({ type: () => SessionUserDto })
  user: SessionUserDto;

  @ApiProperty({ format: "uuid", nullable: true, type: String })
  activeInstitutionId: string | null;

  @ApiProperty({ enum: InstitutionRole, enumName: "InstitutionRole", nullable: true })
  institutionRole: InstitutionRole | null;

  @ApiProperty({ type: () => [MembershipSummaryDto] })
  memberships: MembershipSummaryDto[];
}

export class AuthSessionDto extends SessionContextDto implements AuthSessionResult {
  @ApiProperty({ description: "Send as `Authorization: Bearer <token>`." })
  accessToken: string;

  @ApiProperty({ type: String, format: "date-time" })
  accessTokenExpiresAt: Date;

  @ApiProperty({
    description:
      "Opaque. Rotates on every refresh; presenting a rotated token again ends the session.",
  })
  refreshToken: string;

  @ApiProperty({ type: String, format: "date-time" })
  refreshTokenExpiresAt: Date;
}

export class SwitchedInstitutionDto implements SwitchedInstitution {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: String, format: "date-time" })
  accessTokenExpiresAt: Date;

  @ApiProperty({ format: "uuid" })
  activeInstitutionId: string;

  @ApiProperty({ enum: InstitutionRole, enumName: "InstitutionRole" })
  institutionRole: InstitutionRole;
}
