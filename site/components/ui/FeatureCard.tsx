import Image from "next/image";
import Link from "next/link";
import { Icon } from "@farmclub/design-system/Icon";
import { IconDisc } from "@farmclub/design-system/IconDisc";
import type { DiscTone } from "@farmclub/design-system/IconDisc";
import type { IconName } from "@farmclub/design-system/Icon";
import type { ImageAsset } from "@/content/pages/home";

type FeatureCardProps = {
  title: string;
  description: string;
  icon?: IconName;
  tone?: DiscTone;
  label?: string;
  /**
   * Photograph shown as a full-bleed band above the copy. When set it takes the
   * place of the icon disc, so the card leads with the subject rather than a glyph.
   */
  image?: ImageAsset;
  /** Sizes hint for the photograph; mirrors the grid the card sits in. */
  imageSizes?: string;
  /** Centred cards are used in icon grids; left-aligned in content grids. */
  align?: "left" | "center";
  /**
   * Adds an arrow link pinned to the bottom of the card, so links line up
   * across a row. Give every card in a grid a link, or none.
   */
  href?: string;
  linkLabel?: string;
  className?: string;
};

export function FeatureCard({
  title,
  description,
  icon,
  tone = "green",
  label,
  image,
  imageSizes = "(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 100vw",
  align = "left",
  href,
  linkLabel = "Explore",
  className,
}: FeatureCardProps) {
  const isCenter = align === "center";
  const showIcon = Boolean(icon) && !image;

  return (
    <article
      className={[
        "surface-card group flex h-full flex-col",
        image ? "overflow-hidden" : "p-6 sm:p-7",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {image ? (
        // 3:2 matches the source photographs, so faces stay clear of the crop.
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-farm-cream-50">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={imageSizes}
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      ) : null}

      <div
        className={[
          "flex flex-1 flex-col",
          image ? "p-6 sm:p-7" : "",
          isCenter ? "items-center text-center" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showIcon && icon ? <IconDisc name={icon} tone={tone} /> : null}
        {label ? (
          // Green-700 rather than gold-600: small label text needs 4.5:1.
          <p
            className={[showIcon ? "mt-5" : "", "type-overline text-farm-green-700"]
              .filter(Boolean)
              .join(" ")}
          >
            {label}
          </p>
        ) : null}
        <h3
          className={[
            "text-lg text-farm-green-950",
            showIcon && !label ? "mt-5" : label ? "mt-2" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {title}
        </h3>
        <p className="mt-2.5 type-body-sm text-farm-muted">{description}</p>
        {href ? (
          <div className="mt-auto flex pt-5">
            <Link
              href={href}
              className="group/link inline-flex items-center gap-2 text-sm font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950 active:text-farm-green-950"
            >
              {linkLabel}
              <span className="sr-only">: {title}</span>
              <Icon
                name="arrow-right"
                size={16}
                className="transition-transform duration-200 group-hover/link:translate-x-1"
              />
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
