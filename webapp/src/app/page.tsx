import { redirect } from "next/navigation";
import { Badge } from "@farmclub/design-system/Badge";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getSessionContext } from "@/lib/session";

/*
  A placeholder home, behind the session. It exists to prove the round trip —
  sign in, land here, and still be here after the access token expires and
  /refresh swaps it. The app shell and the real dashboard replace it next.
*/
export default async function HomePage() {
  const session = await getSessionContext();

  // proxy.ts checks only that a cookie is present. This is the real check.
  if (!session) {
    redirect("/sign-in");
  }

  const institution = session.memberships.find(
    (membership) => membership.institutionId === session.activeInstitutionId,
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-16">
      <p className="type-overline text-farm-green-700">Signed in</p>
      <h1 className="mt-3 type-h1 text-farm-green-950">
        {session.user.firstName} {session.user.lastName}
      </h1>
      <p className="mt-5 type-lead text-farm-muted">{session.user.email}</p>

      <dl className="mt-8 grid gap-3 rounded-panel border border-farm-border p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <dt className="text-sm font-semibold text-farm-green-950">Institution</dt>
          <dd className="text-sm leading-6 text-farm-muted">
            {institution ? institution.institutionName : "None yet"}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <dt className="text-sm font-semibold text-farm-green-950">Role</dt>
          <dd className="text-sm leading-6 text-farm-muted">
            {session.institutionRole ?? session.user.platformRole}
          </dd>
        </div>
      </dl>

      <Badge className="mt-7 self-start" dot tone="warning">
        In development
      </Badge>

      <SignOutButton className="mt-7" />
    </div>
  );
}
