import type { Metadata } from "next";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { notFoundScreen } from "@/content/app";

export const metadata: Metadata = { title: notFoundScreen.title };

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-md px-5 py-20">
      <EmptyState
        action={<ButtonLink href="/">{notFoundScreen.action}</ButtonLink>}
        description={notFoundScreen.description}
        icon="search"
        title={notFoundScreen.title}
      />
    </main>
  );
}
