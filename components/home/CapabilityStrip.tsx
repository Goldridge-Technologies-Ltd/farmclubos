import type { HomePageContent } from "@/content/pages/home";
import { Icon } from "@/components/ui/Icon";

type CapabilityStripProps = {
  content: HomePageContent["capabilities"];
};

/*
  The dark band directly under the hero. The reference artwork shows headline
  impact figures here; FARMCLUB OS has no verified figures to publish, so the
  same band carries the platform's capability statements instead
  (see AGENTS.md, "Homepage Requirements").
*/
export function CapabilityStrip({ content }: CapabilityStripProps) {
  return (
    <section className="bg-farm-green-900 text-white" aria-label="Platform capabilities">
      <div className="site-container">
        <ul className="grid grid-cols-1 divide-y divide-white/12 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
          {content.items.map((item, index) => (
            <li
              key={item.title}
              className={[
                "flex items-center gap-3.5 py-5 sm:py-7",
                index > 0 ? "lg:border-l lg:border-white/12 lg:pl-6" : "",
                "sm:border-b sm:border-white/12 lg:border-b-0",
                index >= content.items.length - 1 ? "sm:border-b-0" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-farm-gold-400/45 text-farm-gold-400">
                <Icon name={item.icon} size={21} />
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-5 font-semibold">{item.title}</p>
                <p className="mt-1 type-caption text-white/58">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
