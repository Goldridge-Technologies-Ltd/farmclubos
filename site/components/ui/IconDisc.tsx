import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export type DiscTone = "green" | "gold" | "pale" | "outline" | "dark";

type IconDiscProps = {
  name: IconName;
  tone?: DiscTone;
  size?: "sm" | "md" | "lg";
  /** Soft white ring behind the disc, as used in the ecosystem diagram. */
  halo?: boolean;
  className?: string;
};

const toneClasses: Record<DiscTone, string> = {
  green: "bg-farm-green-700 text-white",
  gold: "bg-farm-gold-600 text-white",
  pale: "bg-farm-green-50 text-farm-green-900",
  outline: "border border-farm-border-strong bg-white text-farm-green-800",
  dark: "border border-farm-gold-400/40 bg-white/8 text-farm-gold-400",
};

const sizeClasses = {
  sm: { box: "h-11 w-11", icon: 20 },
  md: { box: "h-14 w-14", icon: 24 },
  lg: { box: "h-[4.5rem] w-[4.5rem]", icon: 30 },
} as const;

/** A circular icon container — the site's primary icon treatment. */
export function IconDisc({
  name,
  tone = "green",
  size = "md",
  halo = false,
  className,
}: IconDiscProps) {
  const { box, icon } = sizeClasses[size];

  const disc = (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full",
        box,
        toneClasses[tone],
        halo ? "" : className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon name={name} size={icon} />
    </span>
  );

  if (!halo) return disc;

  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full bg-white p-2.5 shadow-halo",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {disc}
    </span>
  );
}
