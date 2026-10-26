import type { InviteStatus, PlatformRole } from "../../generated/prisma/enums.js";
import type { EmailDeliveryStatus } from "../../lib/mail/mail.service.js";

/** The platform roles that put someone on the content team. */
export type ContentTeamRole = Extract<PlatformRole, "PLATFORM_ADMIN" | "CONTENT_MANAGER">;

/** Someone on the content team: a platform administrator, or a content manager. */
export type ContentTeamMemberView = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  platformRole: ContentTeamRole;
};

/** An invitation onto the content team that is still open, or lapsed and resendable. */
export type ContentTeamInviteView = {
  id: string;
  email: string;
  /** EXPIRED for a pending one past its expiry, even before that is recorded. */
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  /** Always someone for the content team; the column allows none for sign-ups. */
  invitedBy: { id: string; firstName: string; lastName: string } | null;
};

export type IssuedContentTeamInviteView = ContentTeamInviteView & {
  /** FAILED means the invitation exists but its email did not go: resend it. */
  emailStatus: EmailDeliveryStatus;
};

export type ContentTeamView = {
  /** Platform administrators first, then content managers, each by name. */
  members: ContentTeamMemberView[];
  invitations: ContentTeamInviteView[];
};

/** Whoever was taken off the content team. Their account stays. */
export type RemovedMemberView = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};
