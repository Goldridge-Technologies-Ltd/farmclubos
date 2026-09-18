import type { InstitutionRole, InviteStatus } from "../../generated/prisma/enums.js";
import type { EmailDeliveryStatus } from "../../lib/mail/mail.service.js";

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
  role: InstitutionRole;
  expiresAt: Date;
  /** True when the invitee should sign in and join, rather than create an account. */
  accountExists: boolean;
  institution: { id: string; name: string };
};
