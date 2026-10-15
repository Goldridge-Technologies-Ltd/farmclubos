import type { EmailDeliveryStatus } from "../../lib/mail/mail.service.js";

export type AddPlatformAdminInput = {
  email: string;
  /** Needed for a new account only; an existing account keeps its names. */
  firstName?: string;
  lastName?: string;
};

export type AddedPlatformAdmin = {
  email: string;
  /** A new account, made now. */
  created: boolean;
  /** The account became a platform administrator now, rather than being one already. */
  granted: boolean;
  /** A deactivated account was made active again. */
  reactivated: boolean;
  /**
   * The emailed link to set a password, sent only to an account without one.
   * An account with a password keeps it.
   */
  passwordLink: { emailStatus: EmailDeliveryStatus; expiresInDays: number } | null;
};
