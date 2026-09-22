import type { Metadata } from "next";
import { CapabilityScreenView } from "@/components/ui/CapabilityScreenView";
import { enterpriseScreen } from "@/content/app";

export const metadata: Metadata = { title: "Enterprise" };

export default function EnterprisePage() {
  return <CapabilityScreenView screen={enterpriseScreen} />;
}
