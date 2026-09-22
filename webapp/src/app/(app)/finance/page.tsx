import type { Metadata } from "next";
import { FutureCapabilityPanel } from "@/components/ui/FutureCapabilityPanel";
import { financeCapability } from "@/content/future";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  return <FutureCapabilityPanel capability={financeCapability} />;
}
