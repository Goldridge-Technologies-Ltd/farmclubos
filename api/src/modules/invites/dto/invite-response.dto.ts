import { ApiProperty } from "@nestjs/swagger";
import { InstitutionRole, InviteStatus } from "../../../generated/prisma/enums.js";
import { MembershipSummaryDto } from "../../auth/dto/auth-response.dto.js";
import type {
  InviteJoinedView,
  InviteKind,
  InviteLookupKind,
  InviteLookupView,
  InviteView,
  IssuedInviteView,
} from "../invites.types.js";

const INVITE_KINDS = ["INSTITUTION", "CONTENT_TEAM"];
const INVITE_LOOKUP_KINDS = [...INVITE_KINDS, "SIGNUP"];

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

  @ApiProperty({
    type: () => InviterDto,
    nullable: true,
    description: "Null for someone who signed up themselves.",
  })
  invitedBy: InviterDto | null;
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

  @ApiProperty({
    enum: INVITE_LOOKUP_KINDS,
    description:
      "A place in an institution, or on the content team that builds the Academy; SIGNUP " +
      "for a link someone sent themselves by signing up.",
  })
  kind: InviteLookupKind;

  @ApiProperty({
    enum: InstitutionRole,
    enumName: "InstitutionRole",
    nullable: true,
    description: "Null for the content team.",
  })
  role: InstitutionRole | null;

  @ApiProperty({ type: String, format: "date-time" })
  expiresAt: Date;

  @ApiProperty({
    description: "True when the invitee should sign in and join, rather than create an account.",
  })
  accountExists: boolean;

  @ApiProperty({
    type: () => InviteInstitutionDto,
    nullable: true,
    description: "Null for the content team, which belongs to no institution.",
  })
  institution: InviteInstitutionDto | null;
}

export class InviteJoinedDto implements InviteJoinedView {
  @ApiProperty({ enum: INVITE_KINDS })
  kind: InviteKind;

  @ApiProperty({
    type: () => MembershipSummaryDto,
    nullable: true,
    description: "The membership an institution invitation gave; null for the content team.",
  })
  membership: MembershipSummaryDto | null;
}
