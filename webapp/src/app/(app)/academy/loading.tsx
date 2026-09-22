import { Skeleton } from "@farmclub/design-system/Skeleton";

/*
  The shape of the catalogue, not a spinner, so the page does not jump when
  the real thing arrives. Skeleton is aria-hidden; the role="status" sits on
  the region, so loading is announced once rather than once per bar.
*/
export default function AcademyLoading() {
  return (
    <div aria-busy="true" className="app-stack" role="status">
      <span className="sr-only">Loading the Academy</span>
      <div className="max-w-2xl">
        <Skeleton className="w-24" variant="text" />
        <Skeleton className="mt-3 h-8 w-64" variant="block" />
        <Skeleton className="mt-4 w-full" variant="text" />
      </div>
      <div className="grid gap-3">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-32 w-full" variant="block" />
        ))}
      </div>
    </div>
  );
}
