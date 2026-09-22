import type { ReactNode } from "react";
import { SectionLabel } from "@farmclub/design-system/SectionLabel";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

type PageHeaderProps = {
  /** The optional trail above the heading, for nested screens. */
  crumbs?: Crumb[];
  eyebrow?: string;
  /** The page's only `h1`. */
  heading: string;
  description?: string;
  /** One or two actions, right-aligned from sm upwards. */
  actions?: ReactNode;
};

/*
  The top of every app screen.

  `type-h2-band` carries the heading rather than `type-h1`: the website's h1
  roles are sized for a marketing hero, and an app screen sitting beside a
  sidebar would be shouted at by one (docs/design-system.md §4.1).
*/
export function PageHeader({
  crumbs,
  eyebrow,
  heading,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="grid gap-4 sm:flex sm:items-end sm:justify-between sm:gap-6">
      <div className="max-w-2xl">
        {crumbs ? <Breadcrumbs crumbs={crumbs} /> : null}
        {eyebrow ? <SectionLabel className={crumbs ? "mt-3" : ""}>{eyebrow}</SectionLabel> : null}
        <h1 className={`type-h2-band text-farm-green-950 ${eyebrow || crumbs ? "mt-3" : ""}`.trim()}>
          {heading}
        </h1>
        {description ? (
          <p className="mt-4 type-body text-farm-muted">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-3 sm:shrink-0">{actions}</div> : null}
    </div>
  );
}
