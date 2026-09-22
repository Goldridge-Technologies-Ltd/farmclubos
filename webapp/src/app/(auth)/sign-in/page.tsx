import type { Metadata } from "next";
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
      <p className="mt-6 type-caption text-farm-muted">{authContent.signIn.noAccount}</p>
    </>
  );
}
