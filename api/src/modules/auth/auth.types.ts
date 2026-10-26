export type { ClientContext } from "../../common/auth/client-context.js";
import type { InstitutionRole, PlatformRole } from "../../generated/prisma/enums.js";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: PlatformRole;
};

export type MembershipSummary = {
  institutionId: string;
  institutionName: string;
  institutionSlug: string;
  role: InstitutionRole;
  /**
   * True for FARMCLUB's home for people learning on their own, which a screen
   * should call independent learning rather than name as an institution.
   */
  independentLearners: boolean;
};

export type AuthSessionResult = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: SessionUser;
  activeInstitutionId: string | null;
  institutionRole: InstitutionRole | null;
  memberships: MembershipSummary[];
};

export type SessionContext = {
  user: SessionUser;
  activeInstitutionId: string | null;
  institutionRole: InstitutionRole | null;
  memberships: MembershipSummary[];
};

export type SwitchedInstitution = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  activeInstitutionId: string;
  institutionRole: InstitutionRole;
};
