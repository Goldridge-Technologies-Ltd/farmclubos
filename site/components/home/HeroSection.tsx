import Image from "next/image";
import type { HomePageContent } from "@/content/pages/home";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";

type HeroSectionProps = {
  content: HomePageContent["hero"];
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-farm-green-950">
      <Image
        src={content.image.src}
        alt={content.image.alt}
        fill
        preload
        sizes="100vw"
        className="object-cover object-[68%_center]"
      />
      <div aria-hidden="true" className="hero-scrim" />

      <div className="site-container relative flex min-h-[clamp(30rem,44vw,38rem)] flex-col justify-center py-16 sm:py-20">
        <div className="max-w-xl animate-rise lg:max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-farm-gold-400">
            {content.eyebrow}
          </p>
          <h1 className="mt-3 type-display text-white">{content.heading}</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/85 sm:text-lg">
            {content.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <ButtonLink href={content.primaryAction.href} size="lg">
              {content.primaryAction.label}
            </ButtonLink>
            <ButtonLink
              href={content.secondaryAction.href}
              variant="outline-gold"
              size="lg"
            >
              {content.secondaryAction.label}
            </ButtonLink>
          </div>
        </div>

        {/* Mission card, floated over the lower-right of the photograph. */}
        <div className="mt-12 max-w-sm rounded-card bg-white/97 p-5 shadow-float backdrop-blur-sm lg:absolute lg:right-[max(2rem,calc(50vw-600px))] lg:bottom-10 lg:mt-0">
          <div className="flex gap-3.5">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-farm-green-50 text-farm-green-700">
              <Icon name="leaf" size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold text-farm-green-950">
                {content.mission.eyebrow}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-farm-muted">
                {content.mission.statement}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
