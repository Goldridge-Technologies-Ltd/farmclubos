import Link from "next/link";
import { Logo } from "@farmclub/design-system/Logo";
import { Icon } from "@farmclub/design-system/Icon";
import { NewsletterSignup } from "@/components/layout/NewsletterSignup";
import { activeSocialLinks, footerColumns, siteContact } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-farm-green-950 text-white">
      <div className="site-container py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_repeat(4,0.8fr)_1.55fr] lg:gap-8">
          <div>
            <Link
              href="/"
              aria-label="FARMCLUB OS home"
              className="block w-[11.5rem]"
            >
              <Logo variant="reversed" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/64">
              The digital platform for agricultural entrepreneurship, innovation
              and ecosystem transformation.
            </p>
            {activeSocialLinks.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {activeSocialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`FARMCLUB OS on ${social.label}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-farm-gold-500 hover:text-farm-green-950"
                    >
                      <Icon name={social.icon} size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="type-overline text-white">
                {column.title}
              </h3>
              <ul className="mt-4 grid gap-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/64 transition-colors hover:text-farm-gold-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="grid gap-8">
            <div>
              <h3 className="type-overline text-white">
                Contact Us
              </h3>
              <ul className="mt-4 grid gap-3 text-sm text-white/64">
                <li className="flex gap-2.5">
                  <Icon
                    name="mail"
                    size={17}
                    className="mt-0.5 shrink-0 text-farm-gold-400"
                  />
                  <a
                    href={`mailto:${siteContact.email}`}
                    className="transition-colors hover:text-farm-gold-400"
                  >
                    {siteContact.email}
                  </a>
                </li>
                <li className="flex gap-2.5">
                  <Icon
                    name="phone"
                    size={17}
                    className="mt-0.5 shrink-0 text-farm-gold-400"
                  />
                  <a
                    href={`tel:${siteContact.phoneHref}`}
                    className="transition-colors hover:text-farm-gold-400"
                  >
                    {siteContact.phone}
                  </a>
                </li>
                <li className="flex gap-2.5">
                  <Icon
                    name="location"
                    size={17}
                    className="mt-0.5 shrink-0 text-farm-gold-400"
                  />
                  <span>{siteContact.location}</span>
                </li>
              </ul>
            </div>
            <NewsletterSignup />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/12 pt-6 text-sm text-white/54 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FARMCLUB OS. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-farm-gold-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="transition-colors hover:text-farm-gold-400"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
