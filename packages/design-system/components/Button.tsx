"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  buttonBaseClass,
  buttonSizeClasses,
  buttonVariants,
} from "./button-classes";
import type {
  ActionButtonVariant,
  ButtonSize,
} from "./button-classes";
import { Icon } from "./Icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ActionButtonVariant;
  size?: ButtonSize;
  /** Trailing glyph. Defaults to an arrow. */
  icon?: "arrow-right" | "none";
  /**
   * Work in progress. The button keeps focus but ignores activation
   * (aria-disabled, aria-busy). Pair it with a role="status" region.
   */
  busy?: boolean;
};

/**
 * A real <button> for actions such as form submits; links styled as buttons
 * use ButtonLink. Defaults to type="button" so it never submits a form by
 * accident. A Client Component only because it guards clicks while busy.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon = "arrow-right",
  busy = false,
  disabled,
  type = "button",
  className,
  onClick,
  ...props
}: ButtonProps) {
  const recipe = buttonVariants[variant];
  const inactive = Boolean(disabled || busy);

  return (
    <button
      type={type}
      // Busy is not native disabled: disabling a focused button drops keyboard
      // focus to the page, so it stays focusable and swallows activation.
      disabled={disabled}
      aria-disabled={busy || undefined}
      aria-busy={busy || undefined}
      onClick={(event) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={[
        buttonBaseClass,
        buttonSizeClasses[size],
        recipe.rest,
        inactive
          ? `opacity-70 ${busy ? "cursor-wait" : "cursor-not-allowed"}`
          : recipe.interactive,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span>{children}</span>
      {icon === "arrow-right" ? (
        <Icon
          name="arrow-right"
          size={18}
          className={[
            "transition-transform duration-200",
            inactive ? "" : "group-hover:translate-x-1",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ) : null}
    </button>
  );
}
