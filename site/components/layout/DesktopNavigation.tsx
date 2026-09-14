"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigationAction, siteNavigation } from "@/lib/navigation";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="hidden flex-1 items-center justify-end gap-8 lg:flex xl:gap-10"
    >
      <ul className="flex items-center gap-6 xl:gap-8">
        {siteNavigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative block py-6 text-[0.875rem] font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "text-farm-green-900"
                    : "text-farm-charcoal/80 hover:text-farm-green-800",
                ].join(" ")}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={[
                    "absolute inset-x-0 bottom-4 h-[2px] rounded-full bg-farm-gold-500 transition-opacity",
                    isActive ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                />
              </Link>
            </li>
          );
        })}
      </ul>
      <ButtonLink href={primaryNavigationAction.href} className="shrink-0">
        {primaryNavigationAction.label}
      </ButtonLink>
    </nav>
  );
}
