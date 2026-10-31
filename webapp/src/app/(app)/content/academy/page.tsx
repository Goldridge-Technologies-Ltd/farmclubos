import { ContentRow } from "@/components/authoring/ContentRow";
import { ContentStatus } from "@/components/authoring/ContentStatus";
import { MoveButtons } from "@/components/authoring/MoveButtons";
import { PathwayForm } from "@/components/authoring/PathwayForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionOutcome, ActionOutcomeMessage } from "@/components/ui/ActionOutcome";
import { Panel } from "@/components/ui/Panel";
import { authoringContent } from "@/content/authoring";
import { createPathway, movePathway, restorePathway } from "@/lib/actions/authoring";
import { assertContentTeam, listAuthoringPathways } from "@/lib/api/authoring";
import { titleAfter } from "@/lib/metadata";

export const generateMetadata = titleAfter(assertContentTeam, "Academy content");

/*
  The Academy's pathways, in the order learners and institutions see them —
  drafts too — with a way to add one. Archived pathways are listed apart, with
  Restore, since this is the only way back to them.
*/
export default async function AcademyContentPage() {
  const pathways = await listAuthoringPathways();
  const copy = authoringContent.pathways;
  const live = pathways.filter((item) => !item.archivedAt);
  const archived = pathways.filter((item) => item.archivedAt);

  return (
    <ActionOutcome>
      <div className="app-stack">
        <PageHeader
          crumbs={[{ label: authoringContent.crumb }, { label: authoringContent.academyCrumb }]}
          description={copy.description}
          eyebrow={copy.eyebrow}
          heading={copy.heading}
        />

        <ActionOutcomeMessage />

        <Panel description={copy.listDescription} title={copy.listTitle}>
          {live.length === 0 ? (
            <p className="type-body-sm text-farm-muted">{copy.empty}</p>
          ) : (
            <ol className="grid gap-4">
              {live.map((item, index) => (
                <ContentRow
                  key={item.id}
                  controls={
                    <MoveButtons
                      action={movePathway}
                      fields={{ pathwayId: item.id }}
                      position={index + 1}
                      target={item.title}
                      total={live.length}
                    />
                  }
                  href={`/content/academy/pathways/${item.id}`}
                  meta={copy.modules(item.moduleCount, item.publishedModuleCount)}
                  status={<ContentStatus archivedAt={null} status={item.status} />}
                  summary={item.summary}
                  title={item.title}
                />
              ))}
            </ol>
          )}
        </Panel>

        <Panel description={copy.add.description} title={copy.add.title}>
          <PathwayForm action={createPathway} busyLabel={copy.add.busy} submitLabel={copy.add.submit} />
        </Panel>

        {archived.length > 0 ? (
          <Panel description={copy.archivedDescription} title={copy.archivedTitle}>
            <ul className="grid gap-4">
              {archived.map((item) => (
                <ContentRow
                  key={item.id}
                  controls={
                    <ActionButton
                      action={restorePathway}
                      busyLabel={authoringContent.archive.restoring}
                      fields={{ pathwayId: item.id, title: item.title }}
                      label={authoringContent.archive.restore}
                      target={item.title}
                    />
                  }
                  href={`/content/academy/pathways/${item.id}`}
                  meta={copy.modules(item.moduleCount, item.publishedModuleCount)}
                  status={<ContentStatus archivedAt={item.archivedAt} status={item.status} />}
                  title={item.title}
                />
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </ActionOutcome>
  );
}
