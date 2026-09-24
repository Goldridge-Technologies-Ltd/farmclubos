import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateCohortForm } from "@/components/institution/CreateCohortForm";
import { Panel } from "@/components/ui/Panel";
import { institutionContent } from "@/content/institution";
import { listPathways } from "@/lib/api/academy";
import { managedInstitution } from "@/lib/api/institution";

export const metadata: Metadata = { title: "Open a new intake" };

export default async function NewCohortPage() {
  const institution = await managedInstitution();
  const pathways = await listPathways();
  const copy = institutionContent.newCohort;

  return (
    <div className="app-stack">
      <PageHeader
        crumbs={[
          { label: institutionContent.crumb },
          { href: "/institution/cohorts", label: institutionContent.cohorts.heading },
          { label: copy.heading },
        ]}
        description={copy.description}
        eyebrow={institution.name}
        heading={copy.heading}
      />

      <Panel>
        <CreateCohortForm
          pathways={pathways.map((pathway) => ({ slug: pathway.slug, title: pathway.title }))}
        />
      </Panel>
    </div>
  );
}
