import type { Metadata } from "next";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { notFoundScreen } from "@/content/app";

export const metadata: Metadata = { title: notFoundScreen.title };

/*
  A record that isn't there, or isn't the caller's: what `notFound()` shows
  anywhere behind a session.

  Next renders the nearest `not-found.tsx` inside the layouts above the page
  that called it, so this sits in the app shell, whose `main#main-content` is
  already the page's. Without it the root `not-found.tsx` rendered here,
  bringing a second `main` with the same id.
*/
export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-md py-20">
      <NotFoundState />
    </div>
  );
}
