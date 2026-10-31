import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditCohortForm } from "@/components/institution/EditCohortForm";
import { Panel } from "@/components/ui/Panel";
import { institutionContent } from "@/content/institution";
import { getCohort, managedInstitution } from "@/lib/api/institution";

type PageProps = { params: Promise<{ cohortId: string }> };

/** Read here as well, so a cohort that isn't there titles the tab as not found. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cohortId } = await params;
  await getCohort((await managedInstitution()).id, cohortId);

  return { title: "Edit cohort" };
}

/** An intake's details, for correcting. A closed intake can be edited too. */
export default async function EditCohortPage({ params }: PageProps) {
  const { cohortId } = await params;
  const institution = await managedInstitution();
  const cohort = await getCohort(institution.id, cohortId);
  const copy = institutionContent.editCohort;

  return (
    <div className="app-stack">
      <PageHeader
        crumbs={[
          { label: institutionContent.crumb },
          { href: "/institution/cohorts", label: institutionContent.cohorts.heading },
          { href: `/institution/cohorts/${cohort.id}`, label: cohort.name },
          { label: copy.heading },
        ]}
        description={copy.description}
        eyebrow={institution.name}
        heading={copy.heading}
      />

      <Panel>
        <EditCohortForm
          cohort={{
            id: cohort.id,
            pathwayTitle: cohort.pathway.title,
            name: cohort.name,
            code: cohort.code,
            deliveryMode: cohort.deliveryMode,
            startsOn: cohort.startsOn,
            endsOn: cohort.endsOn,
          }}
        />
      </Panel>
    </div>
  );
}
