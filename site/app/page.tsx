import type { Metadata } from "next";
import { CapabilityStrip } from "@/components/home/CapabilityStrip";
import { EntrepreneurJourney } from "@/components/home/EntrepreneurJourney";
import { FinalCta } from "@/components/home/FinalCta";
import { HeroSection } from "@/components/home/HeroSection";
import { HubsSection } from "@/components/home/HubsSection";
import { PlatformEcosystem } from "@/components/home/PlatformEcosystem";
import { homePageContent } from "@/content/pages/home";

export const metadata: Metadata = {
  title: "Agricultural Entrepreneurship & Innovation",
  description:
    "FARMCLUB OS connects learning, enterprise development, innovation and markets through one integrated platform.",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "FARMCLUB OS",
  description:
    "FARMCLUB OS connects learning, enterprise development, innovation and markets through one integrated platform.",
  url: "https://farmclub-os.com/",
  publisher: {
    "@type": "Organization",
    name: "FARMCLUB OS",
    logo: "https://farmclub-os.com/brand/primary-logo-horizontal.svg",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HeroSection content={homePageContent.hero} />
      <CapabilityStrip content={homePageContent.capabilities} />
      <PlatformEcosystem content={homePageContent.ecosystem} />
      <EntrepreneurJourney content={homePageContent.journey} />
      <HubsSection content={homePageContent.hubs} />
      <FinalCta content={homePageContent.finalCta} />
    </>
  );
}
