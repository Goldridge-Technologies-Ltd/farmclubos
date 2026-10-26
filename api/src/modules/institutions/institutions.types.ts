import type {
  InstitutionKind,
  InstitutionRole,
  InstitutionStatus,
  InstitutionType,
} from "../../generated/prisma/enums.js";

export type InstitutionView = {
  id: string;
  slug: string;
  name: string;
  type: InstitutionType;
  /** INDEPENDENT_LEARNERS for FARMCLUB's home for people who signed up themselves. */
  kind: InstitutionKind;
  status: InstitutionStatus;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** An active member, as an institution administrator sees them. */
export type MemberView = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: InstitutionRole;
  joinedAt: Date | null;
  /** Their open cohort places here — what removing them would withdraw. */
  openEnrolments: number;
};

/** What removing someone did. */
export type RemovedMemberView = {
  userId: string;
  /** Open cohort places withdrawn with them; 0 when they had none. */
  enrolmentsWithdrawn: number;
};
