import type { Metadata } from "next";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { journeyScreen } from "@/content/app";

export const metadata: Metadata = { title: "My Journey" };

/*
  A placeholder until progress is recorded against an account. It shows no
  figure of any kind: a percentage here before there is real progress to read
  would be exactly the invented number AGENTS.md forbids.
*/
export default function MyJourneyPage() {
  return (
    <div className="app-stack">
      <PageHeader
        description={journeyScreen.description}
        eyebrow={journeyScreen.eyebrow}
        heading={journeyScreen.heading}
      />
      <EmptyState
        description={journeyScreen.building.description}
        icon="grow"
        title={journeyScreen.building.title}
      />
    </div>
  );
}
