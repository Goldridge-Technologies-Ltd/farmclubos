import { redirect } from "next/navigation";

/** The section's one screen, for now, is its institutions. */
export default function PlatformPage() {
  redirect("/platform/institutions");
}
