import type { ReactNode } from "react";
import type { IconName } from "./Icon";
import { IconDisc } from "./IconDisc";

/*
  What a list, a dashboard or a deferred feature shows when it has nothing to
  show. Says what would appear here and what to do next, rather than leaving a
  blank panel.
*/

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  /**
   * The title's element: a `p` beneath the page's own heading, or a heading
   * when the empty state is the page, such as `h1` on a not-found screen.
   */
  titleAs?: "p" | "h1" | "h2" | "h3";
  description?: string;
  /** A single ButtonLink or Button. Optional: some empty states need no action. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  titleAs: Title = "p",
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-panel border border-farm-border bg-farm-cream-50 p-7 text-center sm:p-9 ${className}`.trim()}
    >
      {icon ? (
        <IconDisc className="mx-auto" name={icon} tone="pale" />
      ) : null}
      <Title className={`type-title text-farm-green-950 ${icon ? "mt-5" : ""}`.trim()}>
        {title}
      </Title>
      {description ? (
        <p className="mx-auto mt-3 max-w-md type-body-sm text-farm-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-7 flex justify-center">{action}</div> : null}
    </div>
  );
}
