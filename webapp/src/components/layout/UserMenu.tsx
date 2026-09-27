"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@farmclub/design-system/Icon";
import { FormStatus } from "@/components/form/FormStatus";
import { appShell } from "@/content/app";
import { accountNavigation } from "@/lib/navigation";
import { signOut, switchInstitution } from "@/lib/actions/auth";
import { idleFormState } from "@/lib/actions/form-state";

type Institution = { id: string; name: string };

type UserMenuProps = {
  name: string;
  email: string;
  /** The role as a person reads it, resolved by the caller. */
  role: string;
  institution: string;
  /** Every institution they belong to, to move between. */
  institutions: Institution[];
  activeInstitutionId: string | null;
};

/*
  A disclosure, deliberately not a `role="menu"`.

  Menu semantics promise arrow-key roving over `menuitem`s, and a `menuitem`
  may not be a form. Signing out has to be a form posting to a Server Action —
  it ends the session on the API and clears two httpOnly cookies, and only an
  action may write one. A button that reveals a panel is the honest
  description of what this is, and it behaves the way it is announced.

  Someone in more than one institution switches between them here, since the
  choice belongs to the account rather than to any one screen.
*/
export function UserMenu({
  name,
  email,
  role,
  institution,
  institutions,
  activeInstitutionId,
}: UserMenuProps) {
  const pathname = usePathname();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Open "for this route and institution", as the drawer is open for a route:
  // navigating away, or switching institution, closes it during render rather
  // than leaving a panel hanging over the new page.
  const openKey = `${pathname}|${activeInstitutionId ?? ""}`;
  const [openFor, setOpenFor] = useState<string | null>(null);
  const isOpen = openFor === openKey;
  const canSwitch = institutions.some((item) => item.id !== activeInstitutionId);

  const close = (returnFocus: boolean) => {
    setOpenFor(null);

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
        onClick={() => setOpenFor(isOpen ? null : openKey)}
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

          {canSwitch ? (
            <InstitutionSwitcher
              activeInstitutionId={activeInstitutionId}
              institutions={institutions}
            />
          ) : null}

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

/*
  The institutions to work in, the current one marked. Each is its own form
  posting to one shared action, so a refusal — a membership that ended since
  the page loaded — is shown once, under the list. A success goes home.
*/
function InstitutionSwitcher({
  institutions,
  activeInstitutionId,
}: {
  institutions: Institution[];
  activeInstitutionId: string | null;
}) {
  const [state, action, pending] = useActionState(switchInstitution, idleFormState);
  const headingId = useId();

  return (
    <div className="border-b border-farm-border py-2">
      <p className="px-3 pt-1 type-overline text-farm-green-700" id={headingId}>
        {appShell.menu.institutions}
      </p>
      <ul aria-labelledby={headingId} className="mt-1 grid">
        {institutions.map((item) => (
          <li key={item.id}>
            {item.id === activeInstitutionId ? (
              <p
                aria-current="true"
                className="flex min-h-12 items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-farm-green-950"
                title={item.name}
              >
                <Icon name="tick" size={18} className="shrink-0 text-farm-green-700" />
                <span className="min-w-0 truncate">{item.name}</span>
              </p>
            ) : (
              <form action={action}>
                <input name="institutionId" type="hidden" value={item.id} />
                <button
                  // Stays focusable while a switch is under way, and ignores presses.
                  aria-busy={pending || undefined}
                  aria-disabled={pending || undefined}
                  className={`flex min-h-12 w-full items-center gap-2.5 rounded-button px-3 py-2.5 text-left text-sm font-medium text-farm-charcoal transition-colors hover:bg-farm-cream-50 hover:text-farm-green-800 ${
                    pending ? "cursor-wait" : ""
                  }`.trim()}
                  onClick={(event) => {
                    if (pending) {
                      event.preventDefault();
                    }
                  }}
                  title={item.name}
                  type="submit"
                >
                  {/* The width of the tick, so every name lines up. */}
                  <span aria-hidden="true" className="w-4.5 shrink-0" />
                  <span className="min-w-0 truncate">
                    <span className="sr-only">{appShell.menu.switchTo} </span>
                    {item.name}
                  </span>
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <FormStatus busy={pending ? appShell.menu.switching : undefined} state={state} />
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
