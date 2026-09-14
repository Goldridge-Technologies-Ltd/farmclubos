import type { Metadata } from "next";
import Image from "next/image";
import { BulletList } from "@/components/ui/BulletList";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { CtaBand } from "@/components/ui/CtaBand";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { SectionLabel } from "@farmclub/design-system/SectionLabel";
import { hubsPageContent as content } from "@/content/pages/hubs";

export const metadata: Metadata = {
  title: "Experience & Innovation Hub",
  description:
    "The Experience & Innovation Hub is the physical heart of FARMCLUB OS — a living environment for learning, testing, creating and scaling agricultural solutions.",
};

export default function HubsPage() {
  return (
    <>
      <PageHero
        eyebrow={content.hero.eyebrow}
        heading={content.hero.heading}
        description={`${content.hero.statement} ${content.hero.description}`}
        image={content.hero.image}
        variant="split"
        imagePosition="object-[45%_center]"
        primaryAction={content.hero.primaryAction}
        secondaryAction={content.hero.secondaryAction}
      />

      {/* Capability areas */}
      <section
        id="capabilities"
        className="bg-white pt-10 pb-4 lg:pt-12"
      >
        <div className="site-container">
          <ul className="grid gap-y-9 rounded-panel border border-farm-border bg-white px-6 py-10 shadow-card sm:grid-cols-2 sm:px-8 lg:grid-cols-5 lg:gap-y-0">
            {content.capabilityAreas.items.map((item, index) => (
              <li
                key={item.title}
                className={[
                  "px-3 text-center",
                  index > 0 ? "lg:border-l lg:border-farm-border" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="mx-auto inline-flex text-farm-green-800">
                  <Icon name={item.icon} size={36} />
                </span>
                <h2 className="mt-4 text-base text-farm-green-950">
                  {item.title}
                </h2>
                <p className="mt-2 type-caption text-farm-muted">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What we offer */}
      <section className="section-padding bg-white">
        <div className="site-container">
          <div className="grid gap-9 rounded-band bg-farm-cream-50 p-6 sm:p-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
            <div>
              <SectionLabel>{content.offer.eyebrow}</SectionLabel>
              <h2 className="mt-3 text-[1.7rem] leading-tight text-farm-green-950 sm:text-[2rem]">
                {content.offer.heading}
              </h2>
              <p className="mt-4 type-body text-farm-muted">
                {content.offer.description}
              </p>
              <BulletList items={content.offer.facilities} className="mt-7" />
              <ButtonLink
                href={content.offer.action.href}
                size="lg"
                className="mt-8"
              >
                {content.offer.action.label}
              </ButtonLink>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card">
              <Image
                src={content.offer.image.src}
                alt={content.offer.image.alt}
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Impact goals */}
      <section className="section-padding bg-white pt-0">
        <div className="site-container">
          <SectionIntro
            eyebrow={content.model.eyebrow}
            heading={content.model.heading}
            description={content.model.description}
            align="center"
          />
          <ul className="mt-11 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-y-0">
            {content.model.stages.map((stage, index) => (
              <li
                key={stage.title}
                className={[
                  "px-4 text-center",
                  index > 0 ? "lg:border-l lg:border-farm-border" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="mx-auto inline-flex text-farm-green-800">
                  <Icon name={stage.icon} size={34} />
                </span>
                <h3 className="mt-4 text-[0.95rem] text-farm-green-950">
                  {stage.title}
                </h3>
                <p className="mt-2 type-caption text-farm-muted">
                  {stage.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        eyebrow={content.cta.eyebrow}
        heading={content.cta.heading}
        description={content.cta.description}
        primaryAction={content.cta.primaryAction}
        secondaryAction={content.cta.secondaryAction}
        icon="calendar"
      />
    </>
  );
}
