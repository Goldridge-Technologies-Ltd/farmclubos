import type { InstitutionRole, InviteStatus } from "../../generated/prisma/enums.js";
import type { EmailDeliveryStatus } from "../../lib/mail/mail.service.js";
import type { MembershipSummary } from "../auth/auth.types.js";

/** What accepting an invitation gives: a place in an institution, or on the content team. */
export type InviteKind = "INSTITUTION" | "CONTENT_TEAM";

/**
 * What an invitation is, to the page that opens it: SIGNUP is one someone
 * sent themselves by signing up, which makes them an independent learner.
 */
export type InviteLookupKind = InviteKind | "SIGNUP";

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
  /** Null for someone who signed up themselves. */
  invitedBy: { id: string; firstName: string; lastName: string } | null;
};

export type IssuedInviteView = InviteView & {
  /** FAILED means the invite exists but its email did not go: resend it. */
  emailStatus: EmailDeliveryStatus;
};

export type InviteLookupView = {
  email: string;
  kind: InviteLookupKind;
  /** The institution role; null for the content team. */
  role: InstitutionRole | null;
  expiresAt: Date;
  /** True when the invitee should sign in and join, rather than create an account. */
  accountExists: boolean;
  /**
   * Null for the content team, which belongs to no institution, and for a
   * sign-up: someone who chose nothing to join is not told the name of the
   * home FARMCLUB keeps for them.
   */
  institution: { id: string; name: string } | null;
};

export type InviteJoinedView = {
  kind: InviteKind;
  /** The membership an institution invitation gave; null for the content team. */
  membership: MembershipSummary | null;
};
