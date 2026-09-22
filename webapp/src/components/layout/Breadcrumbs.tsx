import Link from "next/link";
import { Icon } from "@farmclub/design-system/Icon";
import { appShell } from "@/content/app";

export type Crumb = {
  label: string;
  /** Omitted on the last crumb: it is the page you are already on. */
  href?: string;
};

/*
  The trail above a page heading, for screens nested more than one level deep.

  A page passes its own crumbs rather than having them derived from the URL: a
  slug is not a title, and "greenhouse-enterprise" is not what the pathway is
  called. The last crumb is the current page and is never a link — marked
  `aria-current="page"` so that is announced rather than merely looking flat.
*/
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label={appShell.landmarks.breadcrumb}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <Icon
                  aria-hidden="true"
                  name="chevron-right"
                  size={12}
                  className="text-farm-muted"
                />
              ) : null}

              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="type-caption text-farm-muted transition-colors hover:text-farm-green-800"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="type-caption text-farm-green-950"
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
