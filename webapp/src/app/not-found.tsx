import type { Metadata } from "next";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { EmptyState } from "@farmclub/design-system/EmptyState";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <EmptyState
        action={<ButtonLink href="/">Go to your dashboard</ButtonLink>}
        description="The page you were looking for does not exist, or you no longer have access to it."
        icon="search"
        title="Page not found"
      />
    </div>
  );
}
