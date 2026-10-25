import type { Metadata } from "next";
import { FutureCapabilityPanel } from "@/components/ui/FutureCapabilityPanel";
import { enterpriseCapability } from "@/content/future";

export const metadata: Metadata = { title: "Enterprise" };

export default function EnterprisePage() {
  return <FutureCapabilityPanel capability={enterpriseCapability} />;
}
