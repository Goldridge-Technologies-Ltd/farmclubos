import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { notFoundScreen } from "@/content/app";

/*
  What a `not-found.tsx` renders. It is all there is on the page, so its
  title is the page's `h1`.

  It brings no `main`: the page's one `main#main-content` comes from where it
  renders. Inside the app shell that is the shell's own; for an address that
  matches nothing, the root `not-found.tsx` renders under the root layout
  alone and wraps it in one.
*/
export function NotFoundState() {
  return (
    <EmptyState
      action={<ButtonLink href="/">{notFoundScreen.action}</ButtonLink>}
      description={notFoundScreen.description}
      icon="search"
      title={notFoundScreen.title}
      titleAs="h1"
    />
  );
}
