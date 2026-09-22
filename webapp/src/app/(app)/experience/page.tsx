import type { Metadata } from "next";
import { CapabilityScreenView } from "@/components/ui/CapabilityScreenView";
import { experienceScreen } from "@/content/app";

export const metadata: Metadata = { title: "Experience" };

export default function ExperiencePage() {
  return <CapabilityScreenView screen={experienceScreen} />;
}
