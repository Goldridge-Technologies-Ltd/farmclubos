import type {
  CohortStatus,
  DeliveryMode,
  EnrolmentStatus,
  PathwayLevel,
} from "../../generated/prisma/enums.js";

/*
  A learner's own cohorts.

  Tenant-scoped, unlike the catalogue: every query here filters on the
  institution in the access token *and* on the caller, so one learner can
  never read another's enrolment (api/AGENTS.md).

  `progressPercent` is real platform data, derived from completed lessons. It
  is the one figure this module returns, and it is never defaulted to
  something illustrative — an enrolment that has not started is 0 because
  nothing has been completed.
*/

export type CohortPathwayView = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: PathwayLevel;
};

export type CohortSummaryView = {
  id: string;
  name: string;
  /** The institution's own code for this intake. */
  code: string | null;
  status: CohortStatus;
  deliveryMode: DeliveryMode;
  /** `YYYY-MM-DD`, or null when the institution has not set one. */
  startsOn: string | null;
  endsOn: string | null;
  pathway: CohortPathwayView;
};

export type EnrolmentView = {
  id: string;
  status: EnrolmentStatus;
  /** Derived from completed lessons. */
  progressPercent: number;
  enrolledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  cohort: CohortSummaryView;
};
