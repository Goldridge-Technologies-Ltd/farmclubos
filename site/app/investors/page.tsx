import type { Metadata } from "next";
import Image from "next/image";
import { BulletList } from "@/components/ui/BulletList";
import { CtaBand } from "@/components/ui/CtaBand";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { investorsPageContent as content } from "@/content/pages/investors";

export const metadata: Metadata = {
  title: "Investors",
  description:
    "How FARMCLUB OS is building digital infrastructure for agricultural entrepreneurship, and how to request the approved Investor Overview.",
};

export default function InvestorsPage() {
  return (
    <>
      <PageHero
        eyebrow={content.hero.eyebrow}
        heading={content.hero.heading}
        description={content.hero.description}
        image={content.hero.image}
        variant="split"
        imagePosition="object-[45%_center]"
        primaryAction={content.hero.primaryAction}
        secondaryAction={content.hero.secondaryAction}
      >
        <div className="mt-8 max-w-sm rounded-card bg-farm-green-950 p-5 text-white lg:max-w-xs">
          <div className="flex gap-3.5">
            <span className="mt-0.5 shrink-0 text-farm-gold-400">
              <Icon name="eye" size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {content.hero.vision.title}
              </p>
              <p className="mt-1.5 type-caption text-white/68">
                {content.hero.vision.statement}
              </p>
            </div>
          </div>
        </div>
      </PageHero>

      {/* Problem → Platform → Impact */}
      <section
        id="opportunity"
        className="section-padding bg-white"
      >
        <div className="site-container">
          <SectionIntro
            eyebrow={content.opportunity.eyebrow}
            heading={content.opportunity.heading}
            align="center"
          />
          <ol className="mt-11 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
            <FlowCard
              icon="leaf"
              title="The Problem"
              description={content.opportunity.description}
            />
            <FlowArrow />
            <FlowCard
              icon="platform"
              title="Our Platform"
              description={content.model.description}
            />
            <FlowArrow />
            <FlowCard
              icon="impact"
              title="The Impact"
              description={content.impact.description}
            />
          </ol>
        </div>
      </section>

      {/* Why now / why FARMCLUB OS */}
      <section className="bg-white pb-6">
        <div className="site-container grid gap-5 lg:grid-cols-2">
          <div className="rounded-panel bg-farm-cream-50 p-7 sm:p-9">
            <SectionLabel>{content.thesis.eyebrow}</SectionLabel>
            <h2 className="mt-3 text-[1.55rem] leading-tight text-farm-green-950 sm:text-[1.85rem]">
              {content.thesis.heading}
            </h2>
            <p className="mt-4 type-body-sm text-farm-muted">
              {content.thesis.statement}
            </p>
            <BulletList items={content.opportunity.tensions} className="mt-6" />
          </div>

          <div className="rounded-panel bg-farm-cream-50 p-7 sm:p-9">
            <SectionLabel>{content.model.eyebrow}</SectionLabel>
            <h2 className="mt-3 text-[1.55rem] leading-tight text-farm-green-950 sm:text-[1.85rem]">
              {content.model.heading}
            </h2>
            <p className="mt-4 type-body-sm text-farm-muted">
              {content.model.description}
            </p>
            <BulletList
              items={content.model.layers.map(
                (layer) => `${layer.title} — ${layer.description}`
              )}
              className="mt-6"
            />
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="section-padding bg-white">
        <div className="site-container">
          <SectionIntro
            eyebrow="Investment highlights"
            heading={content.sustainability.heading}
            align="center"
          />
          <ul className="mt-11 grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
            {content.thesis.pillars.map((pillar, index) => (
              <li
                key={pillar.title}
                className={[
                  "px-5 text-center",
                  index > 0 ? "lg:border-l lg:border-farm-border" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="mx-auto inline-flex text-farm-green-800">
                  <Icon name={pillar.icon} size={34} />
                </span>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-farm-gold-600">
                  {pillar.label}
                </p>
                <h3 className="mt-1 text-[0.95rem] text-farm-green-950">
                  {pillar.title}
                </h3>
                <p className="mt-2 type-caption text-farm-muted">
                  {pillar.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Principles + governance */}
      <section className="bg-white pb-6">
        <div className="site-container grid gap-5 lg:grid-cols-3">
          <div className="rounded-panel bg-farm-cream-50 p-7">
            <SectionLabel>{content.governance.eyebrow}</SectionLabel>
            <h2 className="mt-3 text-[1.4rem] leading-tight text-farm-green-950">
              {content.governance.heading}
            </h2>
            <BulletList items={content.governance.principles} className="mt-6" />
          </div>

          <figure className="relative min-h-64 overflow-hidden rounded-panel">
            <Image
              src={content.hero.image.src}
              alt="Institutional collaborators reviewing agricultural technology plans."
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-farm-green-950/92 via-farm-green-950/45 to-transparent"
            />
            <figcaption className="absolute inset-x-6 bottom-6 text-white">
              <p className="text-lg leading-snug">
                {content.governance.statement}
              </p>
              <span
                aria-hidden="true"
                className="mt-4 block h-0.5 w-14 bg-farm-gold-500"
              />
            </figcaption>
          </figure>

          <div className="rounded-panel bg-farm-cream-50 p-7">
            <SectionLabel>{content.collaboration.eyebrow}</SectionLabel>
            <h2 className="mt-3 text-[1.4rem] leading-tight text-farm-green-950">
              {content.collaboration.heading}
            </h2>
            <ul className="mt-6 grid gap-4">
              {content.collaboration.items.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-farm-green-700">
                    <Icon name={item.icon} size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-farm-green-950">
                      {item.title}
                    </p>
                    <p className="mt-0.5 type-caption text-farm-muted">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CtaBand
        heading={content.information.heading}
        description={content.information.description}
        primaryAction={content.information.action}
        note={content.information.note}
        icon="secure"
      />
    </>
  );
}

function FlowCard({
  icon,
  title,
  description,
}: {
  icon: "leaf" | "platform" | "impact";
  title: string;
  description: string;
}) {
  return (
    <li className="flex h-full gap-4 rounded-panel bg-farm-cream-50 p-6">
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-farm-green-950 text-white">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <h3 className="text-base text-farm-green-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-farm-muted">{description}</p>
      </div>
    </li>
  );
}

function FlowArrow() {
  return (
    <li
      aria-hidden="true"
      className="hidden items-center justify-center text-farm-muted lg:flex"
    >
      <Icon name="arrow-right" size={22} />
    </li>
  );
}
