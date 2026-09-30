import { Badge } from "@farmclub/design-system/Badge";
import { authoringContent } from "@/content/authoring";
import type { PublishStatus } from "@/lib/api/contracts";

/** Draft, Published or Archived: a label, never colour alone. */
export function ContentStatus({
  status,
  archivedAt,
}: {
  status: PublishStatus;
  archivedAt: string | null;
}) {
  if (archivedAt) {
    return <Badge tone="neutral">{authoringContent.archived}</Badge>;
  }

  return (
    <Badge tone={status === "PUBLISHED" ? "success" : "neutral"}>
      {authoringContent.statuses[status]}
    </Badge>
  );
}
