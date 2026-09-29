import type { Prisma } from "../../generated/prisma/client.js";

/**
 * The enrolments a caller may act on as a learner: their own, in the
 * institution their access token is pinned to — and only while they still
 * belong to it.
 *
 * The token names the institution, but it can be up to
 * `ACCESS_TOKEN_TTL_SECONDS` old. The membership and the institution's own
 * status are read from the database here, so someone removed from an
 * institution, or an institution that is suspended, loses access on the very
 * next request rather than when the token happens to expire. Signing the
 * person out instead would be wrong: a session is not tied to one
 * institution, and they may still belong to others.
 *
 * Every learner-side lookup of an enrolment or an attempt starts from this.
 */
export function ownEnrolment(userId: string, institutionId: string): Prisma.EnrolmentWhereInput {
  return {
    userId,
    institutionId,
    institution: { status: "ACTIVE", archivedAt: null },
    user: { memberships: { some: { institutionId, status: "ACTIVE" } } },
  };
}
