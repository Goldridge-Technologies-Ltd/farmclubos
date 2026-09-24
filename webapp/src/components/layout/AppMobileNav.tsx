"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@farmclub/design-system/Icon";
import { Logo } from "@farmclub/design-system/Logo";
import { appShell } from "@/content/app";
import { appNavigation, isActiveNavItem, type NavGroup, type NavItem } from "@/lib/navigation";

/*
  The same sections as the sidebar, as a drawer, below lg.

  The behaviour is the site's MobileNavigation, which has been through this
  already: the open state is "open for this route" rather than a boolean, so a
  route change — browser back and forward included — closes the drawer during
  render with no effect needed to synchronise the two. Body scroll is locked
  while it is open, and Escape closes it and returns focus to the trigger,
  which is the part keyboard users notice when it is missing.
*/
export function AppMobileNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const isOpen = openForPath === pathname;

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
        aria-label={isOpen ? appShell.menu.close : appShell.menu.open}
        aria-expanded={isOpen}
        aria-controls="app-mobile-navigation"
        onClick={() => setOpenForPath(isOpen ? null : pathname)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-button border border-farm-border text-farm-green-950 transition-colors hover:border-farm-green-700 hover:bg-farm-cream-50"
      >
        <Icon name={isOpen ? "close" : "menu"} size={22} />
      </button>

      {isOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpenForPath(null)}
            className="fixed inset-0 z-40 bg-farm-green-950/45"
          />
          <div
            ref={panelRef}
            id="app-mobile-navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-[19rem] max-w-[85vw] flex-col bg-farm-green-950 shadow-raised"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/12 px-5">
              <Logo className="h-7 w-auto" variant="reversed" />
              <button
                type="button"
                aria-label={appShell.menu.close}
                onClick={() => {
                  setOpenForPath(null);
                  triggerRef.current?.focus();
                }}
                className="inline-flex h-12 w-12 items-center justify-center rounded-button text-white/72 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <nav
              aria-label={appShell.landmarks.drawer}
              className="flex-1 overflow-y-auto p-4"
            >
              <ul className="grid gap-1">
                {appNavigation.map((item) => (
                  <li key={item.href}>
                    <DrawerLink
                      item={item}
                      isActive={isActiveNavItem(item.href, pathname)}
                      onNavigate={() => setOpenForPath(null)}
                    />
                  </li>
                ))}
              </ul>

              {groups.map((group) => (
                <div key={group.heading}>
                  <p className="mt-7 px-3 type-overline text-white/55">{group.heading}</p>
                  <ul className="mt-2 grid gap-1">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <DrawerLink
                          item={item}
                          isActive={isActiveNavItem(item.href, pathname)}
                          onNavigate={() => setOpenForPath(null)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}

function DrawerLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={[
        "flex min-h-12 items-start gap-3 rounded-button px-3 py-3 transition-colors",
        isActive ? "bg-white/10 text-white" : "text-white/72 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      <Icon
        name={item.icon}
        size={20}
        className={`mt-0.5 shrink-0 ${isActive ? "text-farm-gold-400" : "text-white/72"}`}
      />
      <span className="flex-1">
        <span className="block text-sm font-semibold">{item.label}</span>
        <span className="mt-0.5 block type-caption text-white/62">{item.description}</span>
      </span>
    </Link>
  );
}
