import type { ReactNode } from "react";

type PanelProps = {
  /** Rendered as an `h2`; omit for a panel that needs no heading. */
  title?: string;
  description?: string;
  /** One action, aligned with the title. */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/*
  The app's basic content surface: a flat white card with a hairline border.

  Borders before shadows (docs/design-system.md §2) — a shadow here would say
  "this floats above the page", which a panel does not. App-only: the website
  composes its sections differently, so this is not in the shared package.
*/
export function Panel({ title, description, action, children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-panel border border-farm-border bg-white p-6 sm:p-7 ${className}`.trim()}
    >
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <h2 className="type-title text-farm-green-950">{title}</h2>
            {description ? (
              <p className="mt-2 type-body-sm text-farm-muted">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      {children ? <div className={title ? "mt-6" : ""}>{children}</div> : null}
    </section>
  );
}
