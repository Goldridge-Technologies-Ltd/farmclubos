import { redirect } from "next/navigation";

/** The section has no page of its own; its work happens on its two screens. */
export default function InstitutionPage() {
  redirect("/institution/cohorts");
}
