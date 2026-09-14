import { Icon } from "@/components/ui/Icon";

type BulletListProps = {
  items: string[];
  tone?: "light" | "dark";
  columns?: 1 | 2;
  className?: string;
};

/** Checked bullet list, matching the tick markers used across the references. */
export function BulletList({
  items,
  tone = "light",
  columns = 1,
  className,
}: BulletListProps) {
  const isDark = tone === "dark";

  return (
    <ul
      className={[
        "grid gap-3.5",
        columns === 2 ? "sm:grid-cols-2 sm:gap-x-8" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => (
        <li
          key={item}
          className={[
            "flex gap-3 text-sm leading-6",
            isDark ? "text-white/82" : "text-farm-charcoal",
          ].join(" ")}
        >
          <Icon
            name="check"
            size={20}
            className={[
              "mt-0.5 shrink-0",
              isDark ? "text-farm-gold-400" : "text-farm-green-700",
            ].join(" ")}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
