import type { Metadata } from "next";
import { LegalNotice } from "@/components/ui/LegalNotice";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FARMCLUB OS handles information submitted through this website.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalNotice
      eyebrow="Legal"
      heading="Privacy Policy"
      summary="The full FARMCLUB OS privacy policy is being prepared for publication. This page records what the website does today so visitors are not left guessing."
      points={[
        "This website is a static public site. It does not require an account and does not ask you to sign in.",
        "The contact form on this site is not connected to any delivery or storage service. Anything typed into it is validated in your browser and is never transmitted or saved.",
        "The newsletter field is likewise not connected. No address entered on this site is collected.",
        "No analytics, advertising or third-party tracking scripts are loaded by this website.",
        "If you email or call the team directly, we hold the details you send in order to reply to you.",
      ]}
    />
  );
}
