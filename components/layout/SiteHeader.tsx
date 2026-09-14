import Link from "next/link";
import { DesktopNavigation } from "@/components/layout/DesktopNavigation";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Logo } from "@/components/ui/Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-farm-border bg-white/96 backdrop-blur-sm">
      <div className="site-container flex h-[4.75rem] items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="FARMCLUB OS home"
          className="block w-44 shrink-0 sm:w-[13.5rem]"
        >
          <Logo variant="primary" preload />
        </Link>
        <DesktopNavigation />
        <MobileNavigation />
      </div>
    </header>
  );
}
