"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@farmclub/design-system/Icon";
import { appShell } from "@/content/app";
import { accountNavigation } from "@/lib/navigation";
import { signOut } from "@/lib/actions/auth";

type UserMenuProps = {
  name: string;
  email: string;
  /** The role as a person reads it, resolved by the caller. */
  role: string;
  institution: string;
};

/*
  A disclosure, deliberately not a `role="menu"`.

  Menu semantics promise arrow-key roving over `menuitem`s, and a `menuitem`
  may not be a form. Signing out has to be a form posting to a Server Action —
  it ends the session on the API and clears two httpOnly cookies, and only an
  action may write one. A button that reveals a panel is the honest
  description of what this is, and it behaves the way it is announced.
*/
export function UserMenu({ name, email, role, institution }: UserMenuProps) {
  const pathname = usePathname();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Open "for this route", as the drawer is: navigating away closes it during
  // render rather than leaving a panel hanging over the new page.
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const isOpen = openForPath === pathname;

  const close = (returnFocus: boolean) => {
    setOpenForPath(null);

    if (returnFocus) {
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close(true);
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        close(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={appShell.menu.account}
        onClick={() => setOpenForPath(isOpen ? null : pathname)}
        className="flex min-h-12 items-center gap-2.5 rounded-button border border-farm-border py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-farm-border-strong hover:bg-farm-cream-50"
      >
        <Avatar name={name} />
        <span className="hidden text-sm font-semibold text-farm-green-950 sm:block">
          {name}
        </span>
        <Icon
          name="chevron-down"
          size={16}
          className={`text-farm-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          id={panelId}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-panel border border-farm-border bg-white p-2 shadow-raised"
        >
          <div className="border-b border-farm-border px-3 pb-3 pt-2">
            <p className="type-overline text-farm-green-700">{appShell.menu.signedInAs}</p>
            <p className="mt-1.5 truncate text-sm font-semibold text-farm-green-950">
              {email}
            </p>
            <p className="mt-1 truncate type-caption text-farm-muted">
              {role} · {institution}
            </p>
          </div>

          <nav aria-label={appShell.landmarks.account} className="pt-2">
            <ul className="grid">
              {accountNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => close(false)}
                    className="flex min-h-12 items-center gap-2.5 rounded-button px-3 py-2.5 text-sm font-medium text-farm-charcoal transition-colors hover:bg-farm-cream-50 hover:text-farm-green-800"
                  >
                    <Icon name={item.icon} size={18} className="text-farm-green-800" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <form action={signOut} className="border-t border-farm-border pt-2">
            <button
              type="submit"
              className="flex min-h-12 w-full items-center gap-2.5 rounded-button px-3 py-2.5 text-left text-sm font-medium text-farm-charcoal transition-colors hover:bg-farm-cream-50 hover:text-farm-green-800"
            >
              <Icon name="logout" size={18} className="text-farm-green-800" />
              {appShell.menu.signOut}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

/** Initials, not a photograph: the platform holds no avatar images. */
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden="true"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-farm-green-700 text-xs font-semibold text-white"
    >
      {initials}
    </span>
  );
}
