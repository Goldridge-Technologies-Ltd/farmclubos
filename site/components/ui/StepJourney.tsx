import { Icon } from "@/components/ui/Icon";
import type { IconItem } from "@/content/pages/home";

type StepJourneyProps = {
  steps: IconItem[];
  /** "lg" for the full-width homepage band, "sm" beside an intro column. */
  size?: "sm" | "lg";
  className?: string;
};

/**
 * The numbered six-step progression, with dashed connectors between steps on
 * wide screens. Steps stack on small screens, where the connectors are dropped.
 */
export function StepJourney({
  steps,
  size = "lg",
  className,
}: StepJourneyProps) {
  const isLarge = size === "lg";
  const disc = isLarge ? "h-[5.5rem] w-[5.5rem]" : "h-16 w-16";
  const iconSize = isLarge ? 34 : 26;
  const connectorTop = isLarge ? "top-11" : "top-8";
  const connectorInset = isLarge ? "2.75rem" : "2rem";

  return (
    <ol
      className={[
        "grid grid-cols-1 gap-y-9 sm:grid-cols-2 lg:grid-cols-6 lg:gap-y-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="relative flex flex-col items-center px-1.5 text-center"
        >
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className={`absolute ${connectorTop} hidden items-center lg:flex`}
              style={{
                left: `calc(50% + ${connectorInset})`,
                right: `calc(-50% + ${connectorInset})`,
              }}
            >
              <span className="h-px flex-1 border-t border-dashed border-farm-border-strong" />
              <Icon
                name="arrow-right"
                size={12}
                className="-ml-0.5 shrink-0 text-farm-muted"
              />
            </span>
          ) : null}

          <span className="relative">
            <span
              className={`flex ${disc} items-center justify-center rounded-full bg-farm-green-50 text-farm-green-900`}
            >
              <Icon name={step.icon} size={iconSize} />
            </span>
            <span
              className={[
                "absolute -top-1 -left-1 inline-flex items-center justify-center rounded-full bg-farm-green-950 font-bold text-white",
                isLarge ? "h-7 w-7 text-xs" : "h-6 w-6 text-[0.65rem]",
              ].join(" ")}
            >
              {index + 1}
            </span>
          </span>

          <h3
            className={[
              "mt-4 text-farm-green-950",
              isLarge ? "text-base" : "text-sm",
            ].join(" ")}
          >
            {step.title}
          </h3>
          <p
            className={[
              "mt-1.5 leading-5 text-farm-muted",
              isLarge ? "max-w-[11rem] text-[0.8rem]" : "text-[0.72rem]",
            ].join(" ")}
          >
            {step.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
