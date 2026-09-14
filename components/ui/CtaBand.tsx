import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { IconName } from "@/components/ui/Icon";
import type { HomeAction } from "@/content/pages/home";

type CtaBandProps = {
  eyebrow?: string;
  heading: string;
  description: string;
  primaryAction: HomeAction;
  secondaryAction?: HomeAction;
  /** Decorative mark on the left of the band. */
  icon?: IconName;
  /** Optional note under the actions, e.g. an access caveat. */
  note?: string;
};

/** The deep-green closing band used at the foot of every page. */
export function CtaBand({
  eyebrow,
  heading,
  description,
  primaryAction,
  secondaryAction,
  icon = "leaf",
  note,
}: CtaBandProps) {
  return (
    <section className="bg-white pt-6 pb-14">
      <div className="site-container">
        <div className="grid gap-8 rounded-band bg-farm-green-950 px-6 py-11 text-white sm:px-10 lg:grid-cols-[1.25fr_auto] lg:items-center lg:gap-12 lg:px-12">
          <div className="flex items-start gap-5">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-farm-gold-400/40 text-farm-gold-400 sm:inline-flex">
              <Icon name={icon} size={26} />
            </span>
            <div>
              {eyebrow ? <SectionLabel tone="dark">{eyebrow}</SectionLabel> : null}
              <h2
                className={["type-h2-band", eyebrow ? "mt-2.5" : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                {heading}
              </h2>
              <p className="mt-3 max-w-xl type-body-sm text-white/70">
                {description}
              </p>
            </div>
          </div>

          <div className="lg:text-right">
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <ButtonLink href={primaryAction.href} variant="gold" size="lg">
                {primaryAction.label}
              </ButtonLink>
              {secondaryAction ? (
                <ButtonLink
                  href={secondaryAction.href}
                  variant="outline-light"
                  size="lg"
                >
                  {secondaryAction.label}
                </ButtonLink>
              ) : null}
            </div>
            {note ? (
              <p className="mt-3.5 max-w-xs type-caption text-white/55 lg:ml-auto">
                {note}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
