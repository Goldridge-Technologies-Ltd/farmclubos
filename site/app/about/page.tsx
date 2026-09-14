import type { Metadata } from "next";
import Image from "next/image";
import { BulletList } from "@/components/ui/BulletList";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CtaBand } from "@/components/ui/CtaBand";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Icon } from "@/components/ui/Icon";
import { IconDisc } from "@/components/ui/IconDisc";
import { PageHero } from "@/components/ui/PageHero";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { aboutPageContent as content } from "@/content/pages/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why FARMCLUB OS exists and how it connects technology, agricultural enterprise, institutions and practical experience.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={content.hero.eyebrow}
        heading={content.hero.heading}
        description={content.hero.description}
        image={content.hero.image}
        imagePosition="object-[62%_center]"
        primaryAction={content.hero.primaryAction}
        secondaryAction={content.hero.secondaryAction}
      />

      {/* Mission / Vision / Values, with the impact focus panel alongside. */}
      <section className="bg-white pt-12 pb-6 lg:pt-14">
        <div className="site-container grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-stretch">
          <div className="grid gap-8 rounded-panel border border-farm-border bg-farm-cream-50 p-7 sm:grid-cols-3 sm:p-9">
            <PurposeColumn
              icon="target"
              title={content.purpose.mission.title}
              description={content.purpose.mission.description}
            />
            <PurposeColumn
              icon="eye"
              title={content.purpose.vision.title}
              description={content.purpose.vision.description}
              bordered
            />
            <div className="text-center">
              <IconDisc
                name="values"
                tone="outline"
                className="mx-auto mb-5"
              />
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-farm-green-950">
                Our Values
              </h3>
              <BulletList
                items={content.principles.items.map((item) => item.title)}
                className="mt-4 justify-items-start text-left"
              />
            </div>
          </div>

          <div className="rounded-panel bg-farm-green-950 p-7 text-white sm:p-8">
            <SectionLabel tone="dark">Our Impact Focus</SectionLabel>
            <ul className="mt-6 grid gap-x-6 gap-y-7 sm:grid-cols-2">
              {content.positioning.connections.map((item) => (
                <li key={item.title} className="flex gap-3.5">
                  <span className="mt-0.5 shrink-0 text-farm-gold-400">
                    <Icon name={item.icon} size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 type-caption text-white/64">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="section-padding bg-white">
        <div className="site-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <div>
            <SectionLabel>{content.caseForChange.eyebrow}</SectionLabel>
            <h2 className="mt-3 text-[1.8rem] leading-[1.15] text-farm-green-950 sm:text-[2.15rem]">
              {content.caseForChange.heading}
            </h2>
            {content.caseForChange.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-5 type-body text-farm-muted"
              >
                {paragraph}
              </p>
            ))}
            <p className="mt-5 type-body text-farm-muted">
              {content.caseForChange.organisingIdea}
            </p>
            <ButtonLink
              href={content.cta.primaryAction.href}
              size="lg"
              className="mt-8"
            >
              {content.cta.primaryAction.label}
            </ButtonLink>
          </div>
          {/* The technology image is a wide dashboard panorama; its natural ratio
              keeps the FARMCLUB OS interface readable instead of centre-cropping it. */}
          <div className="relative aspect-[732/277] overflow-hidden rounded-panel">
            <Image
              src={content.caseForChange.image.src}
              alt={content.caseForChange.image.alt}
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Commitment to change */}
      <section
        id="commitment"
        className="section-padding bg-farm-cream-50"
      >
        <div className="site-container">
          <SectionIntro
            eyebrow={content.commitments.eyebrow}
            heading="Our Commitment to Change"
            align="center"
          />
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {content.commitments.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                align="center"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Journey note */}
      <section className="bg-white pt-14">
        <div className="site-container">
          <div className="rounded-panel border border-farm-border bg-farm-cream-50 p-7 text-center sm:p-10 lg:grid lg:grid-cols-[0.4fr_1fr] lg:items-center lg:gap-10 lg:text-left">
            <div className="lg:flex lg:flex-col lg:items-center lg:text-center">
              <IconDisc name="grow" tone="outline" size="lg" className="mx-auto mb-5" />
              {/*
                This eyebrow is rendered larger than the shared SectionLabel
                default (a moderate step up, not a page heading) so "Our
                journey" reads as a proper section title; scoped to this card
                only, not a change to SectionLabel itself.
              */}
              <p className="text-sm font-bold tracking-[0.16em] text-farm-gold-600 uppercase sm:text-base">
                {content.stewardship.eyebrow}
              </p>
            </div>
            <div className="mx-auto mt-4 max-w-2xl lg:mx-0 lg:mt-0 lg:max-w-none">
              <h2 className="text-[1.5rem] leading-snug text-farm-green-950 sm:text-[1.85rem]">
                {content.stewardship.heading}
              </h2>
              <p className="mt-4 type-body text-farm-muted">
                {content.stewardship.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand {...content.cta} icon="handshake" />
    </>
  );
}

function PurposeColumn({
  icon,
  title,
  description,
  bordered = false,
}: {
  icon: "target" | "eye";
  title: string;
  description: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={[
        "text-center",
        bordered
          ? "sm:border-x sm:border-farm-border sm:px-6"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <IconDisc name={icon} tone="outline" className="mx-auto mb-5" />
      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-farm-green-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-farm-muted">{description}</p>
    </div>
  );
}
