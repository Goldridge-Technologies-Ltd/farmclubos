import { Button } from "@farmclub/design-system/Button";
import { appShell } from "@/content/app";
import { signOut } from "@/lib/actions/auth";

/*
  A real form posting to a Server Action, not an onClick: signing out has to
  end the session on the API and clear two cookies, and only a Server Action
  may write a cookie.
*/
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut} className={className}>
      <Button icon="none" type="submit" variant="secondary">
        {appShell.menu.signOut}
      </Button>
    </form>
  );
}
