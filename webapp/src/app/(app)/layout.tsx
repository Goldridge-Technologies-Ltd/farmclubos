import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSessionContext } from "@/lib/session";

/*
  Everything behind a session.

  The session is fetched once, here, and handed to the shell as props rather
  than read again by each screen. `proxy.ts` has already checked that a cookie
  is present, but presence is not proof: this is the real check, and it asks
  the API rather than trusting the token, so a membership suspended since the
  token was issued takes effect now.

  `redirect()` throws, so it is never called inside a try/catch.
*/
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSessionContext();

  if (!session) {
    redirect("/sign-in");
  }

  return <AppShell session={session}>{children}</AppShell>;
}
