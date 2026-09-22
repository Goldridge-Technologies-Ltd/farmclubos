import type { Metadata } from "next";
import { CapabilityScreenView } from "@/components/ui/CapabilityScreenView";
import { mentorshipScreen } from "@/content/app";

export const metadata: Metadata = { title: "Mentorship" };

export default function MentorshipPage() {
  return <CapabilityScreenView screen={mentorshipScreen} />;
}
