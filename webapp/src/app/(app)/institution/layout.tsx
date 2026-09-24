import type { ReactNode } from "react";
import { managedInstitution } from "@/lib/api/institution";

/*
  The institution's management screens. Someone who cannot manage the active
  institution gets not-found for the whole section — the same answer the API
  would give them — rather than screens that fail one request at a time.
*/
export default async function InstitutionLayout({ children }: { children: ReactNode }) {
  await managedInstitution();

  return children;
}
