import type {
  InstitutionRole,
  InstitutionStatus,
  InstitutionType,
} from "../../generated/prisma/enums.js";

export type InstitutionView = {
  id: string;
  slug: string;
  name: string;
  type: InstitutionType;
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
};
