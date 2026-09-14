import type { HomePageContent } from "@/content/pages/home";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { siteContact } from "@/lib/site";

type FinalCtaProps = {
  content: HomePageContent["finalCta"];
};

export function FinalCta({ content }: FinalCtaProps) {
  return (
    <section className="bg-white py-6 pb-14">
      <div className="site-container">
        <div className="grid items-center gap-8 rounded-band bg-farm-green-900 px-6 py-9 text-white sm:px-10 lg:grid-cols-[minmax(0,1.5fr)_auto_auto] lg:gap-9">
          <div className="flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-farm-gold-400 sm:inline-flex">
              <Icon name="leaf" size={23} />
            </span>
            <div>
              <h2 className="max-w-sm text-lg leading-snug text-balance sm:text-[1.3rem]">
                {content.heading}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/68">
                {content.description}
              </p>
            </div>
          </div>

          <ul className="grid gap-3 text-sm lg:border-l lg:border-white/14 lg:pl-10">
            <li className="flex items-center gap-2.5">
              <Icon
                name="mail"
                size={18}
                className="shrink-0 text-farm-gold-400"
              />
              <a
                href={`mailto:${siteContact.email}`}
                className="transition-colors hover:text-farm-gold-400"
              >
                {siteContact.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Icon
                name="phone"
                size={18}
                className="shrink-0 text-farm-gold-400"
              />
              <a
                href={`tel:${siteContact.phoneHref}`}
                className="transition-colors hover:text-farm-gold-400"
              >
                {siteContact.phone}
              </a>
            </li>
          </ul>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href={content.primaryAction.href} variant="gold" size="lg">
              {content.primaryAction.label}
            </ButtonLink>
            <ButtonLink
              href={content.secondaryAction.href}
              variant="outline-light"
              size="lg"
            >
              {content.secondaryAction.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
