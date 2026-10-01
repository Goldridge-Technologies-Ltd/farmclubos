import type { InstitutionRole, InviteStatus } from "../../generated/prisma/enums.js";
import type { EmailDeliveryStatus } from "../../lib/mail/mail.service.js";
import type { MembershipSummary } from "../auth/auth.types.js";

/** What accepting an invitation gives: a place in an institution, or on the content team. */
export type InviteKind = "INSTITUTION" | "CONTENT_TEAM";

export type InviteView = {
  id: string;
  email: string;
  role: InstitutionRole;
  /** EXPIRED for a pending invite past its expiry, even before it is recorded. */
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  invitedBy: { id: string; firstName: string; lastName: string };
};

export type IssuedInviteView = InviteView & {
  /** FAILED means the invite exists but its email did not go: resend it. */
  emailStatus: EmailDeliveryStatus;
};

export type InviteLookupView = {
  email: string;
  kind: InviteKind;
  /** The institution role; null for the content team. */
  role: InstitutionRole | null;
  expiresAt: Date;
  /** True when the invitee should sign in and join, rather than create an account. */
  accountExists: boolean;
  /** Null for the content team, which belongs to no institution. */
  institution: { id: string; name: string } | null;
};

export type InviteJoinedView = {
  kind: InviteKind;
  /** The membership an institution invitation gave; null for the content team. */
  membership: MembershipSummary | null;
};
