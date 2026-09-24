import Link from "next/link";
import { Logo } from "@farmclub/design-system/Logo";
import { appShell } from "@/content/app";
import type { SessionContext } from "@/lib/api/contracts";
import type { NavGroup } from "@/lib/navigation";
import { AppMobileNav } from "./AppMobileNav";
import { UserMenu } from "./UserMenu";

/*
  The bar above every app screen: the drawer trigger and logo on small
  screens, the active institution on large ones, and the account menu.

  A server component. Only the two pieces that need state — the drawer and the
  account menu — are client components, which is why the session is resolved
  here and handed down as plain strings.
*/
export function AppTopBar({
  session,
  groups,
}: {
  session: SessionContext;
  groups: NavGroup[];
}) {
  const name = `${session.user.firstName} ${session.user.lastName}`.trim();
  const membership = session.memberships.find(
    (item) => item.institutionId === session.activeInstitutionId,
  );
  const institution =
    membership?.institutionName ??
    (session.user.platformRole === "PLATFORM_ADMIN"
      ? appShell.menu.platform
      : appShell.menu.noInstitution);
  const role = session.institutionRole ?? session.user.platformRole;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-farm-border bg-white px-5 sm:px-8">
      <AppMobileNav groups={groups} />

      <Link href="/" className="inline-flex lg:hidden" aria-label="FARMCLUB OS home">
        <Logo className="h-7 w-auto" variant="primary" />
      </Link>

      {/*
        The institution is shown because someone can belong to more than one,
        and which one they are acting in changes what every screen returns.
        Switching between them arrives with the screens that need it.
      */}
      <p className="hidden truncate text-sm font-semibold text-farm-green-950 lg:block">
        {institution}
      </p>

      <div className="ml-auto">
        <UserMenu
          email={session.user.email}
          institution={institution}
          name={name}
          role={appShell.roles[role]}
        />
      </div>
    </header>
  );
}
