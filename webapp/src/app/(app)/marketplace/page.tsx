import type { Metadata } from "next";
import { FutureCapabilityPanel } from "@/components/ui/FutureCapabilityPanel";
import { marketplaceCapability } from "@/content/future";

export const metadata: Metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return <FutureCapabilityPanel capability={marketplaceCapability} />;
}
