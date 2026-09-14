import type { Metadata } from "next";
import Image from "next/image";
import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { CtaBand } from "@/components/ui/CtaBand";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { SectionLabel } from "@farmclub/design-system/SectionLabel";
import { StepJourney } from "@/components/ui/StepJourney";
import { platformPageContent as content } from "@/content/pages/platform";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "Explore the FARMCLUB OS platform modules and the connected agricultural enterprise operating model.",
};

export default function PlatformPage() {
  return (
    <>
      <PageHero
        eyebrow={content.hero.eyebrow}
        heading={content.hero.heading}
        description={content.hero.description}
        image={content.hero.image}
        imagePosition="object-[64%_center]"
        primaryAction={content.hero.primaryAction}
        secondaryAction={content.hero.secondaryAction}
      />

      {/* Capability band */}
      <section className="bg-white pt-8">
        <div className="site-container">
          <ul className="grid gap-y-9 rounded-band bg-farm-green-900 px-6 py-11 text-white sm:grid-cols-2 sm:px-8 lg:grid-cols-6 lg:gap-y-0">
            {content.capabilityMap.items.map((item, index) => (
              <li
                key={item.title}
                className={[
                  "px-2 text-center",
                  index > 0 ? "lg:border-l lg:border-white/12" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-farm-gold-400/40 text-farm-gold-400">
                  <Icon name={item.icon} size={25} />
                </span>
                <h3 className="mt-4 text-base">{item.title}</h3>
                <p className="mt-2 type-caption text-white/62">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Journey */}
      <section
        id="how-it-works"
        className="section-padding bg-white"
      >
        <div className="site-container">
          <div className="rounded-band border border-farm-border bg-farm-cream-50 px-6 py-11 sm:px-9 lg:grid lg:grid-cols-[0.72fr_2fr] lg:items-center lg:gap-10">
            <div>
              <SectionLabel>{content.journey.eyebrow}</SectionLabel>
              <h2 className="mt-3 type-h2-panel text-farm-green-950">
                {content.journey.heading}
              </h2>
              <p className="mt-4 type-body-sm text-farm-muted">
                {content.journey.description}
              </p>
              <ButtonLink href={content.journey.action.href} className="mt-7">
                {content.journey.action.label}
              </ButtonLink>
            </div>
            <StepJourney
              steps={content.journey.steps}
              size="sm"
              className="mt-10 lg:mt-0"
            />
          </div>
        </div>
      </section>

      {/* Modules */}
      <section
        id="modules"
        className="section-padding bg-farm-cream-50"
      >
        <div className="site-container">
          <SectionIntro
            eyebrow={content.architecture.eyebrow}
            heading={content.architecture.heading}
            description={content.architecture.description}
            align="center"
          />
          {/*
            The reference ecosystem infographic is a finished, information-dense
            asset (title, purpose, structure, journey and outcomes already
            composed together), so it's shown as-is at its native ratio via
            object-contain rather than rebuilt from the modules data as cards or
            a generated diagram. Capped narrower than the full site-container so
            it reads as a contained graphic rather than an edge-to-edge banner;
            below that cap it scales fluidly with the viewport (no forced
            min-width) so nothing needs to scroll on mobile. Displaying it under
            its native 1536px width keeps it sharp rather than upscaled.
          */}
          <div className="mx-auto mt-11 max-w-4xl">
            <div className="surface-card relative aspect-[1536/1024] w-full overflow-hidden bg-white p-3 sm:p-4">
              <Image
                src={content.architecture.image.src}
                alt={content.architecture.image.alt}
                fill
                sizes="(min-width: 960px) 896px, 100vw"
                className="object-contain"
              />
            </div>
          </div>
          <p className="mt-7 text-center text-sm text-farm-muted">
            {content.architecture.supportingLine}
          </p>
        </div>
      </section>

      {/* Who we serve */}
      <section
        id="who-we-serve"
        className="section-padding bg-white"
      >
        <div className="site-container">
          <SectionIntro
            eyebrow={content.useCases.eyebrow}
            heading={content.useCases.heading}
            align="center"
          />
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {content.useCases.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
                image={item.image}
                imageSizes="(min-width: 1024px) 23rem, (min-width: 640px) 46vw, 100vw"
                align="center"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Hub bridge */}
      <section className="bg-white pb-4">
        <div className="site-container">
          <div className="grid gap-9 rounded-band bg-farm-green-950 p-6 text-white sm:p-9 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card">
              <Image
                src={content.physicalBridge.image.src}
                alt={content.physicalBridge.image.alt}
                fill
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <SectionLabel tone="dark">
                {content.physicalBridge.eyebrow}
              </SectionLabel>
              <h2 className="mt-3 text-[1.6rem] leading-tight sm:text-[2rem]">
                {content.physicalBridge.heading}
              </h2>
              <p className="mt-4 type-body text-white/72">
                {content.physicalBridge.description}
              </p>
              <ul className="mt-7 flex flex-wrap gap-2.5">
                {content.physicalBridge.flow.map((item) => (
                  <Badge key={item} as="li" size="md" tone="dark">
                    {item}
                  </Badge>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        heading={`${content.cta.eyebrow} ${content.cta.heading}`}
        description={content.cta.description}
        primaryAction={content.cta.primaryAction}
        secondaryAction={content.cta.secondaryAction}
        icon="platform"
      />
    </>
  );
}
