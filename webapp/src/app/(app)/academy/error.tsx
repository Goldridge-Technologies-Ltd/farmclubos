"use client";

import { AppErrorState } from "@/components/ui/AppErrorState";

/** In Next.js 16 the prop is `retry`, not `reset`. */
export default function AcademyError({ retry }: { error: Error; retry: () => void }) {
  return <AppErrorState retry={retry} />;
}
