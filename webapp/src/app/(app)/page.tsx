import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { homeScreen } from "@/content/app";
import { appNavigation } from "@/lib/navigation";
import { getSessionContext } from "@/lib/session";
import Link from "next/link";

export const metadata: Metadata = { title: "Home" };

/*
  The dashboard.

  It carries no figures. A count of lessons, a percentage complete or a number
  of cohorts may appear here only once it comes from real platform data
  (AGENTS.md, docs/design-system.md §13), so for now the screen says plainly
  that there is nothing recorded yet rather than illustrating what it will
  look like when there is.
*/
export default async function HomePage() {
  const session = await getSessionContext();

  // The layout has already checked this; repeating it here is what makes the
  // page safe to render on its own, and satisfies the type.
  if (!session) {
    redirect("/sign-in");
  }

  const sections = appNavigation.filter((item) => item.href !== "/");

  return (
    <div className="app-stack">
      <PageHeader
        description={homeScreen.description}
        eyebrow={homeScreen.eyebrow}
        heading={homeScreen.greeting(session.user.firstName)}
      />

      <EmptyState
        description={homeScreen.building.description}
        icon="grow"
        title={homeScreen.building.title}
      />

      <Panel description={homeScreen.sections.description} title={homeScreen.sections.heading}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {sections.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex h-full items-start gap-3.5 rounded-card border border-farm-border p-5 transition-colors hover:border-farm-border-strong hover:bg-farm-cream-50"
              >
                <Icon
                  name={item.icon}
                  size={22}
                  className="mt-0.5 shrink-0 text-farm-green-800"
                />
                <span className="flex-1">
                  <span className="block text-base font-semibold text-farm-green-950">
                    {item.label}
                  </span>
                  <span className="mt-1 block type-body-sm text-farm-muted">
                    {item.description}
                  </span>
                </span>
                <Icon
                  name="arrow-right"
                  size={16}
                  className="mt-1 shrink-0 text-farm-muted transition-transform group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
