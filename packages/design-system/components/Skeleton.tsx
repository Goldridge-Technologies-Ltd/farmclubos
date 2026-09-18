/*
  A placeholder for content still loading. Every loading.tsx uses it.

  Tailwind's default animation scale is switched off in theme.css, so
  `animate-pulse` compiles to nothing; `animate-shimmer` is the token that
  replaces it, and the global prefers-reduced-motion block already stills it.

  Always aria-hidden: the surrounding region carries the role="status", so a
  screen reader hears "Loading" once rather than one announcement per bar.
*/

type SkeletonProps = {
  /** `text` draws lines of copy; `block` is one shape you size yourself. */
  variant?: "text" | "block";
  /** Lines to draw, for `text`. The last is short, the way a paragraph ends. */
  lines?: number;
  /** Height and width for `block`, using spacing utilities. */
  className?: string;
};

export function Skeleton({ variant = "block", lines = 3, className = "" }: SkeletonProps) {
  if (variant === "text") {
    return (
      <div aria-hidden="true" className={`grid gap-2.5 ${className}`.trim()}>
        {Array.from({ length: lines }, (_, line) => (
          <span
            className={`block h-3.5 rounded-full bg-farm-cream-100 animate-shimmer ${
              line === lines - 1 ? "w-2/3" : "w-full"
            }`}
            key={line}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`block h-24 w-full rounded-card bg-farm-cream-100 animate-shimmer ${className}`.trim()}
    />
  );
}
