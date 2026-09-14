import type { Metadata } from "next";
import { LegalNotice } from "@/components/ui/LegalNotice";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms covering use of the FARMCLUB OS public website.",
};

export default function TermsOfServicePage() {
  return (
    <LegalNotice
      eyebrow="Legal"
      heading="Terms of Service"
      summary="The full FARMCLUB OS terms of service are being prepared for publication. In the meantime, the following describes the status of this website."
      points={[
        "This is the FARMCLUB OS public information website. It is not the authenticated FARMCLUB OS product, and no platform account is created or offered here.",
        "Content on this site is provided for general information about the platform and may change as the product develops.",
        "The site publishes no financial projections, investment terms or performance figures. Investor materials are shared separately on request.",
        "Brand names, logos and content on this site belong to FARMCLUB OS unless otherwise stated.",
        "Forms on this site do not transmit data. To reach the team, use the email address or phone number published on the Contact page.",
      ]}
    />
  );
}
