import { Badge } from "@farmclub/design-system/Badge";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { Icon } from "@farmclub/design-system/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import type { FutureCapability } from "@/content/future";

/*
  A section of the ecosystem that is not open yet: Marketplace, Finance.

  They sit in the navigation rather than being hidden, because they are part
  of how FARMCLUB OS fits together and a person reading the deck will look for
  them. What the page must not do is imply they are nearly here.

  GUARDRAILS (docs/design-system.md §13). One `Badge tone="warning"` reading
  "Coming soon" is the sanctioned use of that component. No date, no ordering,
  no figure and no partner name appears on this page — the copy in
  content/future.ts says only what the capability is for and what has to be
  true first.
*/
export function FutureCapabilityPanel({ capability }: { capability: FutureCapability }) {
  return (
    <div className="app-stack">
      <PageHeader
        actions={
          <Badge dot tone="warning">
            {capability.badge}
          </Badge>
        }
        description={capability.description}
        eyebrow={capability.eyebrow}
        heading={capability.heading}
      />

      <Panel
        description="This part of the ecosystem is built on the ones beneath it, and opens when they are real."
        title="What has to come first"
      >
        <ul className="grid gap-5">
          {capability.dependsOn.map((item) => (
            <li key={item.title} className="flex gap-3.5">
              <Icon
                name="tick"
                size={20}
                className="mt-0.5 shrink-0 text-farm-green-700"
              />
              <div>
                <h3 className="text-sm font-semibold text-farm-green-950">{item.title}</h3>
                <p className="mt-1.5 type-body-sm text-farm-muted">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        action={
          <ButtonLink href={capability.meanwhile.href} size="md">
            {capability.meanwhile.action}
          </ButtonLink>
        }
        description={capability.meanwhile.description}
        title={capability.meanwhile.title}
      />
    </div>
  );
}
