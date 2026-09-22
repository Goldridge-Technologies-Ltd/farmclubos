import type { Metadata } from "next";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { academyScreen } from "@/content/app";

export const metadata: Metadata = { title: "Academy" };

/*
  A placeholder, and deliberately a thin one.

  The pathways, modules and lessons are seeded and the API's read endpoints
  are the next piece of work; this screen becomes the real catalogue then. It
  exists now so the navigation resolves — a section in the sidebar that leads
  to a 404 is worse than one that says it is not connected yet.
*/
export default function AcademyPage() {
  return (
    <div className="app-stack">
      <PageHeader
        description={academyScreen.description}
        eyebrow={academyScreen.eyebrow}
        heading={academyScreen.heading}
      />
      <EmptyState
        description={academyScreen.building.description}
        icon="learn"
        title={academyScreen.building.title}
      />
    </div>
  );
}
