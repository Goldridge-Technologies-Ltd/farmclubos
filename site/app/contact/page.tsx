import type { Metadata } from "next";
import { BulletList } from "@/components/ui/BulletList";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { ContactFormShell } from "@/components/ui/ContactFormShell";
import { FaqList } from "@/components/ui/FaqList";
import { Icon } from "@farmclub/design-system/Icon";
import { IconDisc } from "@farmclub/design-system/IconDisc";
import { PageHero } from "@/components/ui/PageHero";
import { contactPageContent as content } from "@/content/pages/contact";
import { activeSocialLinks, siteContact } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach FARMCLUB OS about partnership, platform support, investment or media enquiries.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow={content.hero.eyebrow}
        heading={content.hero.heading}
        description={content.hero.description}
        image={content.hero.image}
        variant="split"
        imagePosition="object-[45%_center]"
      >
        <BulletList items={content.hero.categories} className="mt-7" />
      </PageHero>

      {/* Form + contact details */}
      <section className="section-padding bg-white">
        <div className="site-container grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <ContactFormShell
            enquiryTypes={content.enquiryTypes}
            integrationNote={content.form.integrationNote}
            requiredNote={content.form.requiredNote}
          />

          <div className="rounded-panel bg-farm-cream-50 p-6 sm:p-8">
            <h2 className="type-title text-farm-green-950">
              Other Ways to Reach Us
            </h2>
            <ul className="mt-6 grid gap-6">
              <ContactRow icon="mail" label="Email">
                <a
                  href={`mailto:${siteContact.email}`}
                  className="text-farm-green-800 transition-colors hover:text-farm-green-950"
                >
                  {siteContact.email}
                </a>
              </ContactRow>
              <ContactRow icon="phone" label="Phone / WhatsApp">
                <a
                  href={`tel:${siteContact.phoneHref}`}
                  className="text-farm-green-800 transition-colors hover:text-farm-green-950"
                >
                  {siteContact.phone}
                </a>
              </ContactRow>
              <ContactRow icon="location" label="Location">
                {siteContact.location}
              </ContactRow>
              <ContactRow icon="clock" label="Office Hours">
                {siteContact.officeHours.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </ContactRow>
            </ul>

            {activeSocialLinks.length > 0 ? (
              <ul className="mt-8 flex flex-wrap gap-2.5 border-t border-farm-border pt-6">
                {activeSocialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`FARMCLUB OS on ${social.label}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-farm-green-900 text-white transition-colors hover:bg-farm-green-700"
                    >
                      <Icon name={social.icon} size={17} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="mt-8 border-l-2 border-farm-gold-500 pl-4 text-xs leading-6 text-farm-muted">
              {content.form.privacyNote}
            </p>
          </div>
        </div>
      </section>

      {/* Enquiry pathways */}
      <section className="bg-white pb-4">
        <div className="site-container">
          <div className="grid gap-5 rounded-band bg-farm-cream-50 p-6 sm:grid-cols-2 sm:p-9 lg:grid-cols-4">
            {content.pathways.items.map((item) => (
              <article key={item.title}>
                <IconDisc name={item.icon} tone="outline" size="sm" />
                <h3 className="mt-4 text-[0.95rem] text-farm-green-950">
                  {item.title}
                </h3>
                <p className="mt-2 type-caption text-farm-muted">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + immediate assistance */}
      <section className="section-padding bg-white">
        <div className="site-container grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <div>
            <h2 className="text-[1.6rem] text-farm-green-950 sm:text-[1.9rem]">
              Frequently Asked Questions
            </h2>
            <div className="mt-7">
              <FaqList items={content.faqs} />
            </div>
          </div>

          <div className="rounded-panel bg-farm-green-950 p-7 text-white">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-farm-gold-400/40 text-farm-gold-400">
              <Icon name="support" size={24} />
            </span>
            <h2 className="mt-5 text-xl">Need something answered directly?</h2>
            <p className="mt-3 text-sm leading-6 text-white/68">
              Email the team and we will point you to the right person.
            </p>
            <ButtonLink
              href={`mailto:${siteContact.email}`}
              variant="gold"
              className="mt-6"
            >
              Email the team
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Partnership band */}
      <section className="bg-white pb-14">
        <div className="site-container">
          <div className="grid items-center gap-6 rounded-band border border-farm-border bg-farm-cream-50 px-6 py-9 sm:px-9 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-farm-green-800">
              <Icon name="handshake" size={26} />
            </span>
            <div>
              <h2 className="type-title text-farm-green-950">
                {content.partnership.heading}
              </h2>
              <p className="mt-2 text-sm leading-6 text-farm-muted">
                {content.partnership.description}
              </p>
            </div>
            <ButtonLink href="/investors" variant="secondary" size="lg">
              Explore Partnership Opportunities
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: "mail" | "phone" | "location" | "clock";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <IconDisc name={icon} tone="outline" size="sm" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-farm-green-950">{label}</p>
        <div className="mt-1 text-sm leading-6 text-farm-muted">{children}</div>
      </div>
    </li>
  );
}
