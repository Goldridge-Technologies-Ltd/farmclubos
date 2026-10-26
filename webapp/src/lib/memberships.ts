import { appShell } from "@/content/app";
import type { MembershipSummary } from "./api/contracts";

/**
 * What to call a membership where the person sees it. FARMCLUB's home for
 * independent learners is never named there: to someone learning on their
 * own it is their own learning, not an institution they chose to join.
 * Screens for the staff who run it use its real name.
 */
export function membershipName(
  membership: Pick<MembershipSummary, "institutionName" | "independentLearners">,
): string {
  return membership.independentLearners
    ? appShell.menu.independentLearning
    : membership.institutionName;
}
