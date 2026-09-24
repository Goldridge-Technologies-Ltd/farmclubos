import type { ReactNode } from "react";
import type { SessionContext } from "@/lib/api/contracts";
import { appShell } from "@/content/app";
import {
  canAdministerPlatform,
  canManageInstitution,
  manageNavigation,
  platformNavigation,
  type NavGroup,
} from "@/lib/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";

/*
  The frame around every signed-in screen: a fixed sidebar from lg upwards, a
  top bar, and the content column.

  `main#main-content` lives here rather than in the root layout, so the skip
  link jumps past the sidebar and the bar into the content — which is the
  whole point of a skip link. Each route group provides its own, because what
  counts as "the content" differs between a centred auth card and this.
*/
export function AppShell({
  session,
  children,
}: {
  session: SessionContext;
  children: ReactNode;
}) {
  const groups: NavGroup[] = [
    ...(canManageInstitution(session)
      ? [{ heading: appShell.manageHeading, items: manageNavigation }]
      : []),
    ...(canAdministerPlatform(session)
      ? [{ heading: appShell.platformHeading, items: platformNavigation }]
      : []),
  ];

  return (
    <div className="min-h-dvh bg-farm-cream-50 lg:pl-[17rem]">
      <div className="fixed inset-y-0 left-0 hidden w-[17rem] lg:block">
        <AppSidebar groups={groups} />
      </div>

      <div className="flex min-h-dvh flex-col">
        <AppTopBar groups={groups} session={session} />
        <main id="main-content" className="flex-1 py-8 sm:py-10">
          <div className="app-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
