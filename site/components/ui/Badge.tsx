import type { ReactNode } from "react";

type BadgeTone =
  | "green"
  | "neutral"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "dark";

type BadgeSize = "sm" | "md";

/*
  Every tone sets a border colour (transparent where there is no visible
  border) so all badges share one box size. Text on each fill is at least
  5:1; the dot is decorative, so the words always carry the meaning.
*/
const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  // Categories and topics on light surfaces.
  green: { badge: "border-transparent bg-farm-green-50 text-farm-green-900", dot: "bg-farm-green-700" },
  neutral: { badge: "border-transparent bg-farm-cream-100 text-farm-muted", dot: "bg-farm-muted" },
  gold: { badge: "border-transparent bg-farm-gold-400 text-farm-green-950", dot: "bg-farm-green-950" },
  // Simple availability such as "Coming soon".
  success: { badge: "border-transparent bg-farm-success-surface text-farm-success", dot: "bg-farm-success" },
  warning: { badge: "border-transparent bg-farm-warning-surface text-farm-warning", dot: "bg-farm-warning" },
  danger: { badge: "border-transparent bg-farm-danger-surface text-farm-danger-strong", dot: "bg-farm-danger" },
  info: { badge: "border-farm-info-border bg-farm-info-surface text-farm-info", dot: "bg-farm-info" },
  // Deep-green bands, as in the platform page's hub-bridge flow.
  dark: { badge: "border-white/20 text-white/85", dot: "bg-farm-gold-400" },
};

const sizes: Record<BadgeSize, string> = {
  sm: "gap-1.5 px-2.5 py-1 text-xs font-semibold",
  md: "gap-2 px-4 py-1.5 text-sm",
};

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** A small leading dot in the tone's colour. */
  dot?: boolean;
  /** Render as a list item when the badges form a list. */
  as?: "span" | "li";
  className?: string;
};

/**
 * A short, static label for a category, topic, step or simple availability.
 * Never a link or button, and never a claim ("Verified", "Premium").
 */
export function Badge({
  children,
  tone = "green",
  size = "sm",
  dot = false,
  as: Tag = "span",
  className,
}: BadgeProps) {
  const { badge, dot: dotColour } = tones[tone];

  return (
    <Tag
      className={[
        "inline-flex items-center rounded-full border",
        sizes[size],
        badge,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot ? (
        <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColour}`} />
      ) : null}
      {children}
    </Tag>
  );
}
