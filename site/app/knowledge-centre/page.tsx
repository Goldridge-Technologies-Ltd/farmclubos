import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CtaBand } from "@/components/ui/CtaBand";
import { Icon } from "@/components/ui/Icon";
import { KnowledgeExplorer } from "@/components/knowledge/KnowledgeExplorer";
import { PageHero } from "@/components/ui/PageHero";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { knowledgePageContent as content } from "@/content/pages/knowledge";

export const metadata: Metadata = {
  title: "Knowledge Centre",
  description:
    "Expert insights, practical tools, training resources and learning paths for agri-entrepreneurs and agribusinesses.",
};

export default function KnowledgeCentrePage() {
  return (
    <>
      <PageHero
        eyebrow={content.hero.eyebrow}
        heading={content.hero.heading}
        description={content.hero.description}
        image={content.hero.image}
        variant="split"
        imagePosition="object-[40%_center]"
      >
        <KnowledgeExplorer
          collections={content.categories.items}
          paths={content.pathways.items}
        />
      </PageHero>

      {/* Collections */}
      <section
        id="collections"
        className="bg-white pt-10 pb-4 lg:pt-12"
      >
        <div className="site-container">
          <ul className="grid gap-y-9 rounded-panel border border-farm-border bg-white px-6 py-10 shadow-card sm:grid-cols-2 sm:px-8 lg:grid-cols-6 lg:gap-y-0">
            {content.categories.items.map((item, index) => (
              <li
                key={item.title}
                className={[
                  "px-3 text-center",
                  index > 0 ? "lg:border-l lg:border-farm-border" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="mx-auto inline-flex text-farm-green-800">
                  <Icon name={item.icon} size={34} />
                </span>
                <h2 className="mt-4 text-[0.95rem] text-farm-green-950">
                  {item.title}
                </h2>
                <p className="mt-2 type-caption text-farm-muted">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Library status */}
      <section className="section-padding bg-white">
        <div className="site-container">
          <div className="rounded-band bg-farm-cream-50 px-6 py-11 sm:px-10 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
            <div>
              <SectionLabel>{content.libraryState.eyebrow}</SectionLabel>
              <h2 className="mt-3 text-[1.6rem] leading-tight text-farm-green-950 sm:text-[1.95rem]">
                {content.libraryState.heading}
              </h2>
              <p className="mt-4 type-body text-farm-muted">
                {content.libraryState.description}
              </p>
            </div>
            <div className="mt-7 flex gap-4 rounded-card border border-farm-border bg-white p-5 lg:mt-0">
              <span className="mt-0.5 shrink-0 text-farm-gold-600">
                <Icon name="report" size={22} />
              </span>
              <p className="type-body-sm text-farm-muted">
                {content.libraryState.note}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning paths */}
      <section
        id="learning-paths"
        className="section-padding bg-farm-cream-50 pt-0"
      >
        <div className="site-container grid gap-10 lg:grid-cols-[0.72fr_2fr] lg:gap-10">
          <div>
            <SectionLabel>{content.pathways.eyebrow}</SectionLabel>
            <h2 className="mt-3 type-h2-panel text-farm-green-950">
              {content.pathways.heading}
            </h2>
            <p className="mt-4 type-body-sm text-farm-muted">
              {content.pathways.description}
            </p>
            <ButtonLink href={content.pathways.action.href} className="mt-7">
              {content.pathways.action.label}
            </ButtonLink>
          </div>

          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {content.pathways.items.map((path) => (
              <li key={path.title} className="surface-card flex flex-col p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-farm-green-50 text-farm-green-800">
                  <Icon name={path.icon} size={22} />
                </span>
                <h3 className="mt-5 text-base text-farm-green-950">
                  {path.title}
                </h3>
                <p className="mt-2 type-caption text-farm-muted">
                  {path.description}
                </p>
                <ul className="mt-4 grid gap-2 border-t border-farm-border pt-4">
                  {path.topics.map((topic) => (
                    <li
                      key={topic}
                      className="type-caption text-farm-charcoal"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand
        heading={content.cta.heading}
        eyebrow={content.cta.eyebrow}
        description={content.cta.description}
        primaryAction={content.cta.primaryAction}
        secondaryAction={content.cta.secondaryAction}
        icon="community"
      />
    </>
  );
}
