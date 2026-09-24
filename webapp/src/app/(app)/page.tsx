import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { ProgressBar } from "@farmclub/design-system/ProgressBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { homeScreen } from "@/content/app";
import { myJourney } from "@/lib/api/academy";
import { nextLesson } from "@/lib/journey";
import { appNavigation, canAdministerPlatform, canManageInstitution } from "@/lib/navigation";
import { getSessionContext } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

/*
  The dashboard.

  A learner sees where they are and the one thing to do next; an administrator
  sees the way into running their institution. Every figure on it is real
  platform data — the percentage is counted by the API from completed lessons
  — and someone not yet enrolled is told so rather than shown a 0% that would
  imply a pathway they do not have.
*/
export default async function HomePage() {
  const [session, journeys] = await Promise.all([getSessionContext(), myJourney()]);

  // The layout has already checked this; repeating it here is what makes the
  // page safe to render on its own, and satisfies the type.
  if (!session) {
    redirect("/sign-in");
  }

  const current = journeys[0];
  const next = current ? nextLesson(current) : null;
  const canManage = canManageInstitution(session);
  const canAdminister = canAdministerPlatform(session);
  const sections = appNavigation.filter((item) => item.href !== "/");

  return (
    <div className="app-stack">
      <PageHeader
        description={homeScreen.description}
        eyebrow={homeScreen.eyebrow}
        heading={homeScreen.greeting(session.user.firstName)}
      />

      {current ? (
        <Panel
          description={homeScreen.continue.cohort(current.cohort.name)}
          title={current.pathway.title}
        >
          {/* Where they are, what is next, then the way to it — in reading order. */}
          <ProgressBar label={homeScreen.continue.through} value={current.progressPercent} />
          <p className="mt-4 type-body-sm text-farm-muted">
            {next
              ? homeScreen.continue.next(next.title, next.moduleTitle)
              : homeScreen.continue.finished}
          </p>
          <ButtonLink className="mt-6" href={next?.href ?? "/my-journey"} size="md">
            {next ? homeScreen.continue.action : homeScreen.continue.journey}
          </ButtonLink>
        </Panel>
      ) : canManage || canAdminister ? null : (
        <EmptyState
          action={<ButtonLink href="/academy">{homeScreen.notEnrolled.action}</ButtonLink>}
          description={homeScreen.notEnrolled.description}
          icon="learn"
          title={homeScreen.notEnrolled.title}
        />
      )}

      {canAdminister ? (
        <Panel description={homeScreen.platform.description} title={homeScreen.platform.title}>
          <ButtonLink href="/platform/institutions" icon="none" size="md" variant="secondary">
            {homeScreen.platform.action}
          </ButtonLink>
        </Panel>
      ) : null}

      {canManage ? (
        <Panel description={homeScreen.manage.description} title={homeScreen.manage.title}>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/institution/members" icon="none" size="md" variant="secondary">
              {homeScreen.manage.members}
            </ButtonLink>
            <ButtonLink href="/institution/cohorts" icon="none" size="md" variant="secondary">
              {homeScreen.manage.cohorts}
            </ButtonLink>
          </div>
        </Panel>
      ) : null}

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
