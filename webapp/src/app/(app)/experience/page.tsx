import type { Metadata } from "next";
import { FutureCapabilityPanel } from "@/components/ui/FutureCapabilityPanel";
import { experienceCapability } from "@/content/future";

export const metadata: Metadata = { title: "Experience" };

export default function ExperiencePage() {
  return <FutureCapabilityPanel capability={experienceCapability} />;
}
