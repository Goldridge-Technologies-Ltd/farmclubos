import type { InstitutionRole, PlatformRole } from "../../generated/prisma/enums.js";
import type { AuthenticatedUser } from "./authenticated-user.js";

/*
  Access tokens are short-lived HS256 JWTs. They are verified without a
  database round trip, so anything they carry — including the institution role
  — can be up to ACCESS_TOKEN_TTL_SECONDS out of date. A change that must take
  effect immediately is checked in the service, against the database.
*/
export const ACCESS_TOKEN_ISSUER = "farmclub-os-api";
export const ACCESS_TOKEN_AUDIENCE = "farmclub-os";
export const ACCESS_TOKEN_ALGORITHM = "HS256" as const;

export type AccessTokenClaims = {
  sub: string;
  sid: string;
  email: string;
  platformRole: PlatformRole;
  institutionId: string | null;
  institutionRole: InstitutionRole | null;
};

export function toAuthenticatedUser(claims: AccessTokenClaims): AuthenticatedUser {
  return {
    userId: claims.sub,
    sessionId: claims.sid,
    email: claims.email,
    platformRole: claims.platformRole,
    institutionId: claims.institutionId,
    institutionRole: claims.institutionRole,
  };
}
