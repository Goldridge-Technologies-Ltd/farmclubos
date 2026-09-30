import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * Whether this render is the page hydrating after a fresh load (a reload, a
 * bookmark, a link from elsewhere) rather than a render in the browser after
 * a move within the app.
 *
 * Focus management reads it once, on mount, to leave a freshly loaded page's
 * focus where the browser puts it. It turns false straight after hydration, so
 * keep the first value in a ref rather than depending on it.
 */
export function useHydrating(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => false,
    () => true,
  );
}
