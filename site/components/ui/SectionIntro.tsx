import { SectionLabel } from "@/components/ui/SectionLabel";

type SectionIntroProps = {
  eyebrow?: string;
  heading: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
};

/** Eyebrow + heading + optional lead paragraph, used to open every section. */
export function SectionIntro({
  eyebrow,
  heading,
  description,
  align = "left",
  tone = "light",
  className,
}: SectionIntroProps) {
  const isCenter = align === "center";
  const isDark = tone === "dark";

  return (
    <div
      className={[
        isCenter ? "mx-auto max-w-3xl text-center" : "max-w-2xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow ? (
        <SectionLabel tone={isDark ? "dark" : "gold"}>{eyebrow}</SectionLabel>
      ) : null}
      <h2
        className={[
          "type-h2",
          eyebrow ? "mt-3" : "",
          isDark ? "text-white" : "text-farm-green-950",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {heading}
      </h2>
      {description ? (
        <p
          className={[
            "mt-4 type-intro",
            isDark ? "text-white/72" : "text-farm-muted",
          ].join(" ")}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
