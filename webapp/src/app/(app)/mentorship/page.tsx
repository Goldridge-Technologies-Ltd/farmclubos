import type { Metadata } from "next";
import { FutureCapabilityPanel } from "@/components/ui/FutureCapabilityPanel";
import { mentorshipCapability } from "@/content/future";

export const metadata: Metadata = { title: "Mentorship" };

export default function MentorshipPage() {
  return <FutureCapabilityPanel capability={mentorshipCapability} />;
}
