import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { siteContact } from "@/lib/site";

type LegalNoticeProps = {
  eyebrow: string;
  heading: string;
  summary: string;
  points: string[];
};

/*
  Interim legal pages. The site links to a privacy policy and terms of service,
  so these routes exist rather than 404 — but they state only what is actually
  true of the website today and make clear the full documents are pending.
*/
export function LegalNotice({
  eyebrow,
  heading,
  summary,
  points,
}: LegalNoticeProps) {
  return (
    <div className="bg-white">
      <div className="site-container max-w-3xl py-16">
        <SectionLabel>{eyebrow}</SectionLabel>
        <h1 className="mt-3 text-[2.1rem] leading-tight text-farm-green-950 sm:text-[2.6rem]">
          {heading}
        </h1>
        <p className="mt-5 text-[0.975rem] leading-7 text-farm-muted">
          {summary}
        </p>

        <ul className="mt-9 grid gap-4">
          {points.map((point) => (
            <li
              key={point}
              className="flex gap-3.5 rounded-card border border-farm-border bg-farm-cream-50 p-5"
            >
              <span className="mt-0.5 shrink-0 text-farm-green-700">
                <Icon name="check" size={20} />
              </span>
              <p className="type-body-sm text-farm-charcoal">{point}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-card border border-farm-border p-6">
          <h2 className="text-base text-farm-green-950">Questions?</h2>
          <p className="mt-2 text-sm leading-6 text-farm-muted">
            Contact the team at{" "}
            <a
              href={`mailto:${siteContact.email}`}
              className="font-semibold text-farm-green-800 underline decoration-farm-gold-500 underline-offset-4"
            >
              {siteContact.email}
            </a>
            .
          </p>
          <ButtonLink href="/contact" variant="secondary" className="mt-5">
            Go to Contact
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
