import Link from "next/link";
import type { LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  buttonBaseClass,
  buttonSizeClasses,
  buttonVariants,
  textButtonBaseClass,
} from "./button-classes";
import type { ButtonSize, ButtonVariant } from "./button-classes";
import { Icon } from "./Icon";

export type { ButtonVariant } from "./button-classes";

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    variant?: ButtonVariant;
    /** Trailing glyph. Defaults to an arrow; "play" for video actions. */
    icon?: "arrow-right" | "play" | "none";
    size?: ButtonSize;
  };

/** Every link styled as a button or arrow link. Actions use Button. */
export function ButtonLink({
  children,
  variant = "primary",
  icon = "arrow-right",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  const isText = variant === "text" || variant === "text-gold";
  const base = isText
    ? textButtonBaseClass
    : `${buttonBaseClass} ${buttonSizeClasses[size]}`;
  const recipe = buttonVariants[variant];

  return (
    <Link
      className={[base, recipe.rest, recipe.interactive, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span>{children}</span>
      {icon === "arrow-right" ? (
        <Icon
          name="arrow-right"
          size={isText ? 16 : 18}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      ) : null}
      {icon === "play" ? <Icon name="play" size={20} /> : null}
    </Link>
  );
}
