/*
  The shapes the API returns, as this app consumes them.

  They are declared here rather than imported from `api/`: the two are separate
  deployables and never share a build. `api/AGENTS.md` carries the other half
  of the bargain — a change to a response shape the web app consumes updates
  this file in the same change.

  Only the fields this app actually uses are listed. A field the API adds and
  nothing here reads does not belong here.
*/

export type PlatformRole = "PLATFORM_ADMIN" | "CONTENT_MANAGER" | "NONE";

export type InstitutionRole =
  | "INSTITUTION_ADMIN"
  | "FACILITATOR"
  | "MENTOR"
  | "LEARNER";

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
};

/** What `/auth/me` returns: who is signed in, and where they are working. */
export type SessionContext = {
  user: SessionUser;
  activeInstitutionId: string | null;
  institutionRole: InstitutionRole | null;
  memberships: MembershipSummary[];
};

/** What sign-in and invite acceptance return: a session context plus tokens. */
export type AuthSession = SessionContext & {
  accessToken: string;
  /** ISO 8601. */
  accessTokenExpiresAt: string;
  refreshToken: string;
  /** ISO 8601. */
  refreshTokenExpiresAt: string;
};

export type InviteLookup = {
  email: string;
  role: InstitutionRole;
  /** ISO 8601. */
  expiresAt: string;
  /** True when the invitee should sign in and join rather than sign up. */
  accountExists: boolean;
  institution: { id: string; name: string };
};
