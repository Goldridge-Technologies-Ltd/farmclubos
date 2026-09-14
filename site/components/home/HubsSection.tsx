import Image from "next/image";
import type { HomePageContent } from "@/content/pages/home";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { SectionLabel } from "@/components/ui/SectionLabel";

type HubsSectionProps = {
  content: HomePageContent["hubs"];
};

/*
  The reference artwork shows a carousel of named hub locations here. Hub
  locations are not confirmed for publication (see AGENTS.md), so the same
  composition presents the Hub as a platform-wide capability instead.
*/
export function HubsSection({ content }: HubsSectionProps) {
  return (
    <section className="bg-white py-6">
      <div className="site-container">
        <div className="grid gap-10 rounded-band bg-farm-green-950 px-6 py-12 text-white sm:px-10 sm:py-14 lg:grid-cols-[0.58fr_1.42fr] lg:items-center lg:gap-12">
          <div className="max-w-sm">
            <SectionLabel tone="dark">{content.eyebrow}</SectionLabel>
            <h2 className="mt-3 text-[1.8rem] leading-[1.15] sm:text-[2.15rem]">
              {content.heading}
            </h2>
            <p className="mt-5 type-body text-white/72">
              {content.description}
            </p>
            <ButtonLink
              href={content.action.href}
              variant="primary"
              size="lg"
              className="mt-8 bg-farm-green-700 hover:bg-farm-green-600"
            >
              {content.action.label}
            </ButtonLink>
          </div>

          <div className="grid gap-8 sm:grid-cols-[1.15fr_0.85fr] sm:items-center">
            <figure className="flex flex-col">
              {/*
                The supplied hub artwork is a dense, info-rich banner (branding,
                badges, dashboard, feature strip) rather than a plain photo, so it
                is shown in full at its native ratio via object-contain instead of
                being centre-cropped. It can exceed the column on the sm-lg split
                layout, where overflow-x-auto keeps the embedded text legible
                instead of shrinking it further.
              */}
              <div className="overflow-x-auto rounded-card">
                <div className="relative aspect-[1672/941] w-full min-w-[420px] overflow-hidden rounded-card bg-white">
                  <Image
                    src={content.image.src}
                    alt={content.image.alt}
                    fill
                    sizes="(min-width: 1024px) 41vw, 100vw"
                    className="object-contain"
                  />
                </div>
              </div>
              <figcaption className="mt-4 border-t border-white/10 pt-4">
                <p className="text-sm font-semibold text-white">
                  {content.imageCaption.title}
                </p>
                <p className="mt-1 type-caption text-white/70">
                  {content.imageCaption.description}
                </p>
                <ButtonLink
                  href={content.imageCaption.action.href}
                  variant="text-gold"
                  className="mt-2 text-xs"
                >
                  {content.imageCaption.action.label}
                </ButtonLink>
              </figcaption>
            </figure>

            <ul className="grid gap-3.5">
              {content.capabilities.map((capability) => (
                <li key={capability.title} className="flex gap-3.5">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-farm-gold-400/45 text-farm-gold-400">
                    <Icon name={capability.icon} size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{capability.title}</p>
                    <p className="mt-0.5 type-caption text-white/62">
                      {capability.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
