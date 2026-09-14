import type { HomePageContent } from "@/content/pages/home";
import { BulletList } from "@/components/ui/BulletList";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EcosystemDiagram } from "@/components/home/EcosystemDiagram";
import { SectionLabel } from "@/components/ui/SectionLabel";

type PlatformEcosystemProps = {
  content: HomePageContent["ecosystem"];
};

export function PlatformEcosystem({ content }: PlatformEcosystemProps) {
  return (
    <section id="ecosystem" className="section-padding bg-white">
      <div className="site-container grid gap-12 lg:grid-cols-[0.66fr_1.34fr] lg:items-center lg:gap-8">
        <div className="max-w-md">
          <SectionLabel>{content.eyebrow}</SectionLabel>
          <h2 className="mt-3 text-[1.9rem] leading-[1.15] text-farm-green-950 sm:text-[2.3rem]">
            {content.heading}
          </h2>
          <p className="mt-5 type-body text-farm-muted">
            {content.description}
          </p>
          <BulletList items={content.bullets} className="mt-7" />
          <ButtonLink href={content.action.href} size="lg" className="mt-8">
            {content.action.label}
          </ButtonLink>
        </div>

        <EcosystemDiagram core={content.core} nodes={content.nodes} />
      </div>
    </section>
  );
}
