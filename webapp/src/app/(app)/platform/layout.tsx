import type { ReactNode } from "react";
import { assertPlatformAdministrator } from "@/lib/api/platform";

/*
  The platform's own screens. Anyone who is not a platform administrator gets
  not-found for the whole section — the same answer the API gives them.
*/
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await assertPlatformAdministrator();

  return children;
}
