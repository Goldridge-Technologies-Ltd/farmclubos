import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateInstitutionForm } from "@/components/platform/CreateInstitutionForm";
import { Panel } from "@/components/ui/Panel";
import { platformContent } from "@/content/platform";

export const metadata: Metadata = { title: "Add an institution" };

export default function NewInstitutionPage() {
  const copy = platformContent.create;

  return (
    <div className="app-stack">
      <PageHeader
        crumbs={[
          { label: platformContent.crumb },
          { href: "/platform/institutions", label: platformContent.list.heading },
          { label: copy.heading },
        ]}
        description={copy.description}
        heading={copy.heading}
      />

      <Panel>
        <CreateInstitutionForm />
      </Panel>
    </div>
  );
}
