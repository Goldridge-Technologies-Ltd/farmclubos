import type {
  EducationLevel,
  EmploymentStatus,
  Gender,
  PlatformRole,
  UserState,
} from "../../generated/prisma/enums.js";

export type LearnerProfileView = {
  /** Explorer, Emerging Entrepreneur or Existing Enterprise. Not self-editable. */
  state: UserState;
  phone: string | null;
  /** `YYYY-MM-DD`. */
  dateOfBirth: string | null;
  gender: Gender | null;
  educationLevel: EducationLevel | null;
  employmentStatus: EmploymentStatus | null;
  location: string | null;
  bio: string | null;
  goals: string | null;
};

export type ProfileView = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: PlatformRole;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  /** Null for staff, who have no learner profile. */
  learnerProfile: LearnerProfileView | null;
};
