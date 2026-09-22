import { EmptyState } from "@farmclub/design-system/EmptyState";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import type { CapabilityScreen } from "@/content/app";

/*
  Experience, Mentorship and Enterprise, before their data exists.

  These three are part of Phase 1 and their tables are already in the
  database; what is not built yet are the screens that read them. So each says
  what it is for and then shows the empty state it will genuinely have on day
  one — a learner with no booking, no mentor and no venture — rather than a
  mock-up of a populated screen.

  Distinct from FutureCapabilityPanel, which is for the two sections that are
  not being built at all yet and carries a "Coming soon" badge.
*/
export function CapabilityScreenView({ screen }: { screen: CapabilityScreen }) {
  return (
    <div className="app-stack">
      <PageHeader
        description={screen.description}
        eyebrow={screen.eyebrow}
        heading={screen.heading}
      />

      <Panel title="What this section does">
        <ul className="grid gap-5 sm:grid-cols-3">
          {screen.capabilities.map((capability) => (
            <li key={capability.title}>
              <Icon name="tick" size={20} className="text-farm-green-700" />
              <h3 className="mt-3 text-sm font-semibold text-farm-green-950">
                {capability.title}
              </h3>
              <p className="mt-1.5 type-body-sm text-farm-muted">
                {capability.description}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <EmptyState description={screen.empty.description} title={screen.empty.title} />
    </div>
  );
}
