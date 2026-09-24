import { Skeleton } from "@farmclub/design-system/Skeleton";

export default function SectionLoading() {
  return (
    <div aria-busy="true" className="app-stack" role="status">
      <span className="sr-only">Loading</span>
      <div className="max-w-2xl">
        <Skeleton className="w-24" variant="text" />
        <Skeleton className="mt-3 h-8 w-64" variant="block" />
        <Skeleton className="mt-4 w-full" variant="text" />
      </div>
      <Skeleton className="h-48 w-full" variant="block" />
      <Skeleton className="h-64 w-full" variant="block" />
    </div>
  );
}
