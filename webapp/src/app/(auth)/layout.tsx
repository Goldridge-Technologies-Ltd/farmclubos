import type { ReactNode } from "react";
import { Logo } from "@farmclub/design-system/Logo";

/*
  The frame around every screen reached before signing in: one centred card,
  nothing to navigate to, nothing to be distracted by. The app shell starts
  only once there is a session.
*/
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-farm-cream-50 px-5 py-12">
      <div className="w-full max-w-md">
        <Logo className="mx-auto h-9 w-auto" preload variant="primary" />
        <div className="mt-8 rounded-panel border border-farm-border bg-white p-7 sm:p-9">
          {children}
        </div>
      </div>
    </div>
  );
}
