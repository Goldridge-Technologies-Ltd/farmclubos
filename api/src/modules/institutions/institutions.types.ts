import type { InstitutionStatus, InstitutionType } from "../../generated/prisma/enums.js";

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
