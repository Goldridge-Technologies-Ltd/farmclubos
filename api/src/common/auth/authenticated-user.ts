import type { Request } from "express";
import type { InstitutionRole, PlatformRole } from "../../generated/prisma/enums.js";

/** Who is making the request, as established from a verified access token. */
export type AuthenticatedUser = {
  userId: string;
  /** The AuthSession the token was issued for. */
  sessionId: string;
  email: string;
  platformRole: PlatformRole;
  /**
   * The institution the user is working in. Every tenant-scoped query filters
   * on this. Null for a user with no active membership, such as a platform
   * admin who belongs to none.
   */
  institutionId: string | null;
  institutionRole: InstitutionRole | null;
};

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };
