"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@farmclub/design-system/Icon";
import { Logo } from "@farmclub/design-system/Logo";
import { appShell } from "@/content/app";
import { appNavigation, isActiveNavItem, manageNavigation } from "@/lib/navigation";

/*
  The permanent sidebar, from lg upwards. Below that the same items appear in
  AppMobileNav's drawer; both read appNavigation, so a section is added once.

  It is a client component only because the active item depends on the current
  path. Nothing else here is interactive.
*/
export function AppSidebar({ canManage }: { canManage: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-farm-green-950">
      <div className="flex h-16 shrink-0 items-center border-b border-white/12 px-6">
        <Link href="/" className="inline-flex" aria-label="FARMCLUB OS home">
          <Logo className="h-7 w-auto" variant="reversed" />
        </Link>
      </div>

      <nav aria-label={appShell.landmarks.sidebar} className="flex-1 overflow-y-auto p-4">
        <ul className="grid gap-1">
          {appNavigation.map((item) => (
            <li key={item.href}>
              <SidebarLink item={item} isActive={isActiveNavItem(item.href, pathname)} />
            </li>
          ))}
        </ul>

        {canManage ? (
          <>
            <p className="mt-7 px-3 type-overline text-white/55">{appShell.manageHeading}</p>
            <ul className="mt-2 grid gap-1">
              {manageNavigation.map((item) => (
                <li key={item.href}>
                  <SidebarLink item={item} isActive={isActiveNavItem(item.href, pathname)} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </nav>
    </div>
  );
}

function SidebarLink({
  item,
  isActive,
}: {
  item: (typeof appNavigation)[number];
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={[
        "flex min-h-12 items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-white/10 text-white"
          : "text-white/72 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      <Icon
        name={item.icon}
        size={20}
        className={isActive ? "text-farm-gold-400" : "text-white/72"}
      />
      <span className="flex-1">{item.label}</span>
      {/*
        The active item is marked twice over: colour alone is not a signal
        (docs/design-system.md §10), and aria-current carries it for a screen
        reader whether or not either is perceived.
      */}
      {isActive ? (
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-farm-gold-400" />
      ) : null}
    </Link>
  );
}
