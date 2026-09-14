import Image from "next/image";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { HomeAction, ImageAsset } from "@/content/pages/home";

type PageHeroProps = {
  eyebrow: string;
  heading: string;
  description: string;
  image: ImageAsset;
  primaryAction?: HomeAction;
  secondaryAction?: HomeAction;
  /**
   * "overlay" — full-bleed photograph with white copy over a dark scrim.
   * "split"   — light background with the photograph bleeding off the right.
   */
  variant?: "overlay" | "split";
  /** Focal point for the photograph, e.g. "object-[70%_center]". */
  imagePosition?: string;
  /** Extra content under the actions (bullet list, search field, aside card). */
  children?: ReactNode;
};

export function PageHero({
  eyebrow,
  heading,
  description,
  image,
  primaryAction,
  secondaryAction,
  variant = "overlay",
  imagePosition = "object-center",
  children,
}: PageHeroProps) {
  const actions =
    primaryAction || secondaryAction ? (
      <div className="mt-8 flex flex-wrap gap-3.5">
        {primaryAction ? (
          <ButtonLink href={primaryAction.href} size="lg" variant="primary">
            {primaryAction.label}
          </ButtonLink>
        ) : null}
        {secondaryAction ? (
          <ButtonLink
            href={secondaryAction.href}
            size="lg"
            variant={variant === "overlay" ? "outline-gold" : "secondary"}
          >
            {secondaryAction.label}
          </ButtonLink>
        ) : null}
      </div>
    ) : null;

  if (variant === "split") {
    return (
      <section className="relative isolate overflow-hidden bg-white">
        {/* Photograph occupies the right of the viewport and bleeds off-screen. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] lg:block">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            preload
            sizes="58vw"
            className={`object-cover ${imagePosition}`}
          />
          <div aria-hidden="true" className="hero-scrim-soft" />
        </div>

        <div className="site-container relative grid min-h-[clamp(24rem,36vw,32rem)] items-center py-12 lg:py-16">
          <div className="max-w-xl">
            <SectionLabel>{eyebrow}</SectionLabel>
            {/* Legacy size: differs slightly from type-h1 (see docs/design-system.md). */}
            <h1 className="mt-3 text-[2.1rem] leading-[1.1] text-farm-green-950 sm:text-[2.75rem] lg:text-[3.1rem]">
              {heading}
            </h1>
            <p className="mt-5 max-w-lg type-lead text-farm-muted">
              {description}
            </p>
            {actions}
            {children}
          </div>
        </div>

        {/* Small screens get the photograph below the copy rather than behind it. */}
        <div className="relative aspect-[16/9] w-full lg:hidden">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="100vw"
            className={`object-cover ${imagePosition}`}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="relative isolate overflow-hidden bg-farm-green-950">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        preload
        sizes="100vw"
        className={`object-cover ${imagePosition}`}
      />
      <div aria-hidden="true" className="hero-scrim" />

      <div className="site-container relative flex min-h-[clamp(24rem,36vw,32rem)] flex-col justify-center py-14 lg:py-16">
        <div className="max-w-xl animate-rise lg:max-w-2xl">
          <SectionLabel tone="dark">{eyebrow}</SectionLabel>
          <h1 className="mt-3 type-h1 text-white">{heading}</h1>
          <p className="mt-5 max-w-xl type-lead text-white/85">
            {description}
          </p>
          {actions}
          {children}
        </div>
      </div>
    </section>
  );
}
