import { Skeleton } from "@farmclub/design-system/Skeleton";

/*
  This segment loads the invitation before it can render, so it needs a
  loading state. Skeleton is aria-hidden; the region announces it once.
*/
export default function AcceptInviteLoading() {
  return (
    <div aria-busy="true" className="grid gap-5" role="status">
      <span className="sr-only">Loading your invitation</span>
      <Skeleton className="h-7 w-2/3" />
      <Skeleton lines={2} variant="text" />
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </div>
  );
}
