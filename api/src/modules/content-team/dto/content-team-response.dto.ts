import { ApiProperty } from "@nestjs/swagger";
import { InviteStatus } from "../../../generated/prisma/enums.js";
import { InviterDto } from "../../invites/dto/invite-response.dto.js";
import type {
  ContentTeamInviteView,
  ContentTeamMemberView,
  ContentTeamRole,
  ContentTeamView,
  IssuedContentTeamInviteView,
  RemovedMemberView,
} from "../content-team.types.js";

export class ContentTeamMemberDto implements ContentTeamMemberView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ["PLATFORM_ADMIN", "CONTENT_MANAGER"] })
  platformRole: ContentTeamRole;
}

export class ContentTeamInviteDto implements ContentTeamInviteView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "maker@example.com" })
  email: string;

  @ApiProperty({
    enum: InviteStatus,
    enumName: "InviteStatus",
    description: "EXPIRED for a pending invitation past its expiry.",
  })
  status: InviteStatus;

  @ApiProperty({ type: String, format: "date-time" })
  expiresAt: Date;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt: Date;

  @ApiProperty({ type: () => InviterDto, nullable: true })
  invitedBy: InviterDto | null;
}

export class IssuedContentTeamInviteDto
  extends ContentTeamInviteDto
  implements IssuedContentTeamInviteView
{
  @ApiProperty({
    enum: ["SENT", "FAILED"],
    description: "FAILED means the invitation exists but its email did not go: resend it.",
  })
  emailStatus: IssuedContentTeamInviteView["emailStatus"];
}

export class ContentTeamDto implements ContentTeamView {
  @ApiProperty({
    type: [ContentTeamMemberDto],
    description: "Platform administrators first, then content managers, each by name.",
  })
  members: ContentTeamMemberDto[];

  @ApiProperty({
    type: [ContentTeamInviteDto],
    description: "Invitations still open: pending, or expired and resendable.",
  })
  invitations: ContentTeamInviteDto[];
}

export class RemovedMemberDto implements RemovedMemberView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}
