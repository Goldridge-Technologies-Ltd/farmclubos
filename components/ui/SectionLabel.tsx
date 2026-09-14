type SectionLabelProps = {
  children: string;
  /** "light" sits on white/cream, "dark" on deep green, "gold" for emphasis. */
  tone?: "light" | "dark" | "gold";
  className?: string;
};

/** The small uppercase gold eyebrow that opens most sections. */
export function SectionLabel({
  children,
  tone = "gold",
  className,
}: SectionLabelProps) {
  const toneClass = {
    light: "text-farm-green-700",
    dark: "text-farm-gold-400",
    gold: "text-farm-gold-600",
  }[tone];

  return (
    <p
      className={[
        "type-eyebrow",
        toneClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </p>
  );
}
