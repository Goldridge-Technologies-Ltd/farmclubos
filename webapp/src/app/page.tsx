import { Badge } from "@farmclub/design-system/Badge";
import { Logo } from "@farmclub/design-system/Logo";
import { SectionLabel } from "@farmclub/design-system/SectionLabel";

/*
  Placeholder home for the web app. It proves the shared tokens, fonts, type
  roles, brand assets and components load; replace it with the first real
  screen.
*/
export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-16 sm:px-8">
      <Logo variant="primary" preload className="h-10 w-auto" />
      <SectionLabel className="mt-12">Web app</SectionLabel>
      <h1 className="mt-3 type-h1 text-farm-green-950">FARMCLUB OS</h1>
      <p className="mt-5 max-w-xl type-lead text-farm-muted">
        The platform for agricultural entrepreneurs, innovators and
        institutions. Features will appear here as they are built.
      </p>
      <Badge tone="warning" dot className="mt-7 self-start">
        In development
      </Badge>
    </div>
  );
}
