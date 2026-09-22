import { Skeleton } from "@farmclub/design-system/Skeleton";

export default function LessonLoading() {
  return (
    <div aria-busy="true" className="app-stack" role="status">
      <span className="sr-only">Loading the lesson</span>
      <div className="max-w-2xl">
        <Skeleton className="w-52" variant="text" />
        <Skeleton className="mt-3 h-8 w-64" variant="block" />
      </div>
      <Skeleton className="h-56 w-full" variant="block" />
    </div>
  );
}
