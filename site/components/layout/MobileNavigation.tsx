"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNavigationAction, siteNavigation } from "@/lib/navigation";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";

export function MobileNavigation() {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /*
    The drawer is tracked as "open for this route" rather than a plain boolean.
    A route change — including browser back and forward — then closes it during
    render, with no effect needed to synchronise the two.
  */
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const isOpen = openForPath === pathname;

  const setIsOpen = (next: boolean) => setOpenForPath(next ? pathname : null);

  // Lock body scroll and wire up Escape while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenForPath(null);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-button border border-farm-border text-farm-green-950 transition-colors hover:border-farm-green-700 hover:bg-farm-cream-50"
      >
        <Icon name={isOpen ? "close" : "menu"} size={22} />
      </button>

      {isOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 top-[4.75rem] z-40 bg-farm-green-950/45"
          />
          <div
            ref={panelRef}
            id="mobile-navigation"
            className="fixed inset-x-0 top-[4.75rem] z-50 max-h-[calc(100dvh-4.75rem)] overflow-y-auto border-b border-farm-border bg-white shadow-raised"
          >
            <nav aria-label="Primary" className="site-container py-5">
              <ul className="grid">
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
                        onClick={() => setIsOpen(false)}
                        className={[
                          "flex items-center justify-between border-b border-farm-border py-4 text-base font-medium transition-colors",
                          isActive
                            ? "text-farm-green-900"
                            : "text-farm-charcoal hover:text-farm-green-800",
                        ].join(" ")}
                      >
                        <span>{item.label}</span>
                        {isActive ? (
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-farm-gold-500"
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <ButtonLink
                href={primaryNavigationAction.href}
                size="lg"
                className="mt-6 w-full"
                onClick={() => setIsOpen(false)}
              >
                {primaryNavigationAction.label}
              </ButtonLink>
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
