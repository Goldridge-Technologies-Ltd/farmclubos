import Link from "next/link";
import type { ReactNode } from "react";

/*
  One module, lesson or scene in a list: what it is, where it stands, and the
  controls that act on it. The title is the link; the controls sit beside it
  rather than inside a link, where buttons may not go.

  A flex row that wraps, so an open confirmation (ConfirmAction) takes the
  whole row beneath.
*/
export function ContentRow({
  href,
  title,
  summary,
  status,
  meta,
  lead,
  controls,
}: {
  href: string;
  title: string;
  summary?: string | null;
  status?: ReactNode;
  meta?: ReactNode;
  /** Before the title, such as a scene's number. */
  lead?: ReactNode;
  controls?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-3 border-b border-farm-border pb-4 last:border-0 last:pb-0">
      {lead}
      <div className="min-w-0 flex-1 basis-60">
        {status || meta ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {status}
            {meta ? <span className="type-caption text-farm-muted">{meta}</span> : null}
          </div>
        ) : null}
        <h3 className={`text-base font-semibold text-farm-green-950 ${status || meta ? "mt-2" : ""}`.trim()}>
          <Link className="transition-colors hover:text-farm-green-800" href={href}>
            {title}
          </Link>
        </h3>
        {summary ? <p className="mt-1 type-body-sm text-farm-muted">{summary}</p> : null}
      </div>
      {controls}
    </li>
  );
}
