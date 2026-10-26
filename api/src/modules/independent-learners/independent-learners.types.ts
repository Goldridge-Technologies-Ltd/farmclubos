import type { EnrolmentStatus } from "../../generated/prisma/enums.js";
import type { SwitchedInstitution } from "../auth/auth.types.js";

/** What starting a pathway on one's own gave. */
export type StartedPathwayView = {
  enrolmentId: string;
  /** ACTIVE, or COMPLETED for a pathway already finished. */
  status: EnrolmentStatus;
  /**
   * A fresh access token when the session moved to independent learning,
   * where the progress is recorded; null when it was there already.
   */
  session: SwitchedInstitution | null;
};
