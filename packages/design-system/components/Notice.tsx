import type { ReactNode } from "react";

/*
  The four status treatments in docs/design-system.md §11.

  Deliberately without a role: §11 says a form keeps one always-mounted
  `<div role="status">` and swaps its content, so a Notice inside it must not
  add a second live region. A banner that stands outside one takes its own
  role from the caller.
*/

type NoticeTone = "info" | "busy" | "success" | "error";

const tones: Record<NoticeTone, { container: string; title: string; body: string }> = {
  // A neutral note: what will happen, what is not connected yet.
  info: {
    container: "border-farm-info-border bg-farm-info-surface",
    title: "text-farm-info",
    body: "text-xs leading-6 text-farm-muted",
  },
  // Work in progress. Pair with a busy Button, never on its own.
  busy: {
    container: "border-farm-info-border bg-farm-info-surface",
    title: "text-farm-info",
    body: "text-sm font-semibold text-farm-info",
  },
  success: {
    container: "border-farm-success bg-farm-success-surface",
    title: "text-farm-green-950",
    body: "text-xs leading-6 text-farm-green-900",
  },
  error: {
    container: "border-farm-danger-border bg-farm-danger-surface",
    title: "text-farm-danger-strong",
    body: "text-sm font-semibold text-farm-danger-strong",
  },
};

type NoticeProps = {
  tone?: NoticeTone;
  /** A short lead line. Without it, the children carry the message alone. */
  title?: string;
  children?: ReactNode;
  className?: string;
};

export function Notice({ tone = "info", title, children, className = "" }: NoticeProps) {
  const styles = tones[tone];

  return (
    <div
      className={`rounded-button border p-3.5 ${styles.container} ${className}`.trim()}
    >
      {title ? (
        <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
      ) : null}
      {children ? (
        <div className={`${styles.body} ${title ? "mt-1" : ""}`.trim()}>{children}</div>
      ) : null}
    </div>
  );
}
