import { ActionButton } from "@/components/ui/ActionButton";
import type { FormAction } from "@/components/ui/ActionOutcome";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Panel } from "@/components/ui/Panel";
import { authoringContent } from "@/content/authoring";
import type { PublishStatus } from "@/lib/api/contracts";

/*
  Publishing and archiving a module or lesson, on its own screen.

  Publishing adds; taking something away from learners asks first. An
  archived item offers only Restore: publishing it straight from the archive
  is refused, so it is not offered.
*/
export function PublishingPanels({
  item,
  fields,
  draftText,
  publishedText,
  actions,
}: {
  item: { title: string; status: PublishStatus; archivedAt: string | null };
  /** The ids the actions need; the title is added for their messages. */
  fields: Record<string, string>;
  draftText: string;
  publishedText: string;
  actions: { publish: FormAction; unpublish: FormAction; archive: FormAction; restore: FormAction };
}) {
  const copy = authoringContent;
  const posted = { ...fields, title: item.title };

  if (item.archivedAt) {
    return (
      <Panel description={copy.archive.notice} title={copy.archived}>
        <ActionButton
          action={actions.restore}
          busyLabel={copy.archive.restoring}
          fields={posted}
          label={copy.archive.restore}
        />
      </Panel>
    );
  }

  const published = item.status === "PUBLISHED";

  return (
    <>
      <Panel
        description={published ? publishedText : draftText}
        title={copy.publishing.title}
      >
        {published ? (
          <ConfirmAction
            action={actions.unpublish}
            busyLabel={copy.publishing.unpublishing}
            confirmLabel={copy.publishing.unpublish}
            consequence={copy.publishing.unpublishConsequence(item.title)}
            fields={posted}
            label={copy.publishing.unpublish}
          />
        ) : (
          <ActionButton
            action={actions.publish}
            busyLabel={copy.publishing.publishing}
            fields={posted}
            label={copy.publishing.publish}
          />
        )}
      </Panel>

      <Panel description={copy.archive.description} title={copy.archive.title}>
        <ConfirmAction
          action={actions.archive}
          busyLabel={copy.archive.busy}
          confirmLabel={copy.archive.label}
          consequence={copy.archive.consequence(item.title)}
          fields={posted}
          label={copy.archive.label}
        />
      </Panel>
    </>
  );
}
