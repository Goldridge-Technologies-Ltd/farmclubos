import { Skeleton } from "@farmclub/design-system/Skeleton";
import { academy } from "@/content/academy";

export default function ModuleLoading() {
  return (
    <div aria-busy="true" className="app-stack" role="status">
      <span className="sr-only">{academy.loading.module}</span>
      <div className="max-w-2xl">
        <Skeleton className="w-40" variant="text" />
        <Skeleton className="mt-3 h-8 w-72" variant="block" />
        <Skeleton className="mt-4 w-full" variant="text" />
      </div>
      <Skeleton className="h-72 w-full" variant="block" />
    </div>
  );
}
