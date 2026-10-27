import type { Prisma } from "../../generated/prisma/client.js";
import type { EnrolmentStatus } from "../../generated/prisma/enums.js";

/**
 * The enrolments that are still a learner's place on a pathway: invited,
 * under way or finished. A finished one stays theirs — they go back over its
 * lessons and retake its quizzes, and the lessons show what they did — while
 * a withdrawn one does not. Use it with `ownEnrolment()` wherever "the
 * caller's enrolment" on a pathway is looked up.
 */
export const LEARNING_STATUSES: EnrolmentStatus[] = ["INVITED", "ACTIVE", "COMPLETED"];

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
