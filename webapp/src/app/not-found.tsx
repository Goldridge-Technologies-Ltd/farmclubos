import type { Metadata } from "next";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { notFoundScreen } from "@/content/app";

export const metadata: Metadata = { title: notFoundScreen.title };

/*
  An address that matches no route. It renders under the root layout alone,
  so it provides the `main#main-content` a route group's layout otherwise
  would. A record that isn't there, inside the app, is `(app)/not-found.tsx`.
*/
export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-md px-5 py-20">
      <NotFoundState />
    </main>
  );
}
