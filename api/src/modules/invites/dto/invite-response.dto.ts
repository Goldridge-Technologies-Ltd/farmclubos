import { ApiProperty } from "@nestjs/swagger";
import { InstitutionRole, InviteStatus } from "../../../generated/prisma/enums.js";
import type { InviteLookupView, InviteView, IssuedInviteView } from "../invites.types.js";

export class InviterDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "Ada" })
  firstName: string;

  @ApiProperty({ example: "Obi" })
  lastName: string;
}

export class InviteDto implements InviteView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "learner@example.com" })
  email: string;

  @ApiProperty({ enum: InstitutionRole, enumName: "InstitutionRole" })
  role: InstitutionRole;

  @ApiProperty({
    enum: InviteStatus,
    enumName: "InviteStatus",
    description: "EXPIRED for a pending invite past its expiry.",
  })
  status: InviteStatus;

  @ApiProperty({ type: String, format: "date-time" })
  expiresAt: Date;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt: Date;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  acceptedAt: Date | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  revokedAt: Date | null;

  @ApiProperty({ type: () => InviterDto })
  invitedBy: InviterDto;
}

export class IssuedInviteDto extends InviteDto implements IssuedInviteView {
  @ApiProperty({
    enum: ["SENT", "FAILED"],
    description: "FAILED means the invitation exists but its email did not go: resend it.",
  })
  emailStatus: "SENT" | "FAILED";
}

export class InviteInstitutionDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "Greenfield Technical College" })
  name: string;
}

export class InviteLookupDto implements InviteLookupView {
  @ApiProperty({ example: "learner@example.com" })
  email: string;

  @ApiProperty({ enum: InstitutionRole, enumName: "InstitutionRole" })
  role: InstitutionRole;

  @ApiProperty({ type: String, format: "date-time" })
  expiresAt: Date;

  @ApiProperty({
    description: "True when the invitee should sign in and join, rather than create an account.",
  })
  accountExists: boolean;

  @ApiProperty({ type: () => InviteInstitutionDto })
  institution: InviteInstitutionDto;
}
