import type { Metadata } from "next";
import Link from "next/link";
import { AuthFormHeader } from "@/components/form/AuthFormHeader";
import { authContent } from "@/content/auth";
import { safeRedirectPath } from "@/lib/session-cookies";
import { SignInForm } from "./_components/SignInForm";

export const metadata: Metadata = { title: "Sign in" };

/** searchParams is a Promise in Next.js 16. */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const { next, reset } = await searchParams;

  return (
    <>
      <AuthFormHeader
        description={authContent.signIn.description}
        heading={authContent.signIn.heading}
      />
      <SignInForm afterReset={reset === "done"} next={safeRedirectPath(next)} />
      <div className="mt-6 grid gap-2 border-t border-farm-border pt-5">
        <p className="text-sm text-farm-muted">
          {authContent.signIn.newHere}{" "}
          <Link
            className="font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
            href="/sign-up"
          >
            {authContent.signIn.createAccount}
          </Link>
        </p>
        <p className="type-caption text-farm-muted">{authContent.signIn.invited}</p>
      </div>
    </>
  );
}
