/*
  Dates as people read them.

  Always formatted in UTC. The API sends a cohort's dates as plain days
  (`2026-09-01`) and everything else as instants; treating either in the
  server's local zone would move a day backwards for anyone west of Greenwich.
*/

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "1 Sept 2026". Empty for a missing or unreadable value. */
export function formatDay(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  // A bare day is pinned to midnight UTC, so it can only ever be that day.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);

  return Number.isNaN(date.getTime()) ? "" : dayFormat.format(date);
}
