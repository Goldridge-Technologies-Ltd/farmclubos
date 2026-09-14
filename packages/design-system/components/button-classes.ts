/*
  Shared button recipes. ButtonLink (links) and Button (<button>) read these
  strings, so a change to a variant lands in one place. A plain module, so
  Server and Client Components can both import it.

  Each variant splits into `rest` (always applied) and `interactive` (hover and
  pressed, left off while a Button is disabled or busy). Pressed (active)
  repeats hover: Tailwind only applies hover: on devices that can hover, so
  active: is the only feedback a touch visitor gets.
*/

export type ButtonVariant =
  | "primary" // deep green fill — the default page action
  | "gold" // gold fill — investor / partnership emphasis
  | "secondary" // light surface with a green border
  | "outline-light" // transparent with a white border, for dark sections
  | "outline-gold" // transparent with a gold border, over photography
  | "text" // inline link with an arrow
  | "text-gold"; // inline link on a dark surface

/** The variants a <button> can use; the rest only make sense as links. */
export type ActionButtonVariant = "primary" | "gold" | "secondary" | "outline-light";

export type ButtonSize = "md" | "lg";

/** Filled and outlined buttons. */
export const buttonBaseClass =
  "group inline-flex items-center justify-center gap-2.5 rounded-button font-semibold transition-colors duration-200";

/** Inline arrow links (text and text-gold). */
export const textButtonBaseClass =
  "group inline-flex items-center gap-2 text-sm font-semibold transition-colors";

export const buttonSizeClasses: Record<ButtonSize, string> = {
  md: "min-h-12 px-6 py-3 text-sm",
  lg: "min-h-13 px-7 py-3.5 text-[0.95rem]",
};

export const buttonVariants: Record<ButtonVariant, { rest: string; interactive: string }> = {
  primary: {
    rest: "bg-farm-green-800 text-white",
    interactive: "hover:bg-farm-green-900 active:bg-farm-green-900",
  },
  gold: {
    rest: "bg-farm-gold-500 text-farm-green-950",
    interactive: "hover:bg-farm-gold-400 active:bg-farm-gold-400",
  },
  secondary: {
    rest: "border border-farm-border-strong bg-white text-farm-green-950",
    interactive:
      "hover:border-farm-green-700 hover:bg-farm-cream-50 active:border-farm-green-700 active:bg-farm-cream-50",
  },
  "outline-light": {
    rest: "border border-white/70 text-white",
    interactive: "hover:border-white hover:bg-white/10 active:border-white active:bg-white/10",
  },
  // Sits over photography, so it carries a light scrim of its own to keep the
  // label legible against a bright frame.
  "outline-gold": {
    rest: "border border-farm-gold-500 bg-farm-green-950/40 text-white backdrop-blur-[2px]",
    interactive:
      "hover:bg-farm-gold-500 hover:text-farm-green-950 active:bg-farm-gold-500 active:text-farm-green-950",
  },
  text: {
    rest: "text-farm-green-800",
    interactive: "hover:text-farm-green-950 active:text-farm-green-950",
  },
  "text-gold": {
    rest: "text-farm-gold-400",
    interactive: "hover:text-farm-gold-500 active:text-farm-gold-500",
  },
};
