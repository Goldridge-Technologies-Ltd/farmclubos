import type { HomePageContent } from "@/content/pages/home";
import { SectionLabel } from "@farmclub/design-system/SectionLabel";
import { StepJourney } from "@/components/ui/StepJourney";

type EntrepreneurJourneyProps = {
  content: HomePageContent["journey"];
};

export function EntrepreneurJourney({ content }: EntrepreneurJourneyProps) {
  return (
    <section id="how-it-works" className="bg-white pb-6">
      <div className="site-container">
        <div className="rounded-band bg-farm-cream-50 px-5 py-12 sm:px-10 sm:py-14">
          <div className="text-center">
            <SectionLabel className="text-center">
              {content.eyebrow}
            </SectionLabel>
            <h2 className="mt-3 text-[1.7rem] text-farm-green-950 sm:text-[2.1rem]">
              {content.heading}
            </h2>
          </div>
          <StepJourney steps={content.steps} className="mt-10" />
        </div>
      </div>
    </section>
  );
}
