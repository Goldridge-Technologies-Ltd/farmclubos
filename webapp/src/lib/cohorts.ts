import type { CohortStatus } from "./api/contracts";

/**
 * Whether an intake has closed: nobody new can be enrolled onto it, though
 * learners already on it can still finish. The API's own rule, repeated here
 * only to decide what to show — it refuses an enrolment onto one regardless.
 */
export function isCohortClosed(status: CohortStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}
