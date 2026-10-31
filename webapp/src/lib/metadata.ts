import type { Metadata } from "next";

/**
 * `generateMetadata` for a page with no record to read, in a section only
 * some may see: its title, once `check` has let the caller in.
 *
 * Next settles a page's metadata apart from the page, so the not-found screen
 * a section's layout shows someone without the role would otherwise keep the
 * page's own title. The check can't live in the layout's `generateMetadata`:
 * a not-found thrown there leaves the screen with no title at all.
 */
export function titleAfter(check: () => Promise<unknown>, title: string) {
  return async (): Promise<Metadata> => {
    await check();

    return { title };
  };
}
