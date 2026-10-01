import type { ReactNode } from "react";
import { assertContentTeam } from "@/lib/api/authoring";

/*
  Where the Academy is built. Anyone off the content team gets not-found for
  the whole section — the answer the API would give them — rather than
  screens that fail one request at a time.
*/
export default async function ContentLayout({ children }: { children: ReactNode }) {
  await assertContentTeam();

  return children;
}
