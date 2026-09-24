import { Skeleton } from "@farmclub/design-system/Skeleton";
import { academy } from "@/content/academy";

export default function AttemptLoading() {
  return (
    <div aria-busy="true" className="app-stack" role="status">
      <span className="sr-only">{academy.loading.assessment}</span>
      <div className="max-w-2xl">
        <Skeleton className="w-52" variant="text" />
        <Skeleton className="mt-3 h-8 w-64" variant="block" />
      </div>
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-40 w-full" variant="block" />
      ))}
    </div>
  );
}
