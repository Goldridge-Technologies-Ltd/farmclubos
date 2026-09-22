import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@farmclub/design-system/Notice";
import { AuthFormHeader } from "@/components/form/AuthFormHeader";
import { authContent } from "@/content/auth";
import { ResetPasswordForm } from "./_components/ResetPasswordForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // Whether the token is still good is the API's call, made on submit. A
  // missing one, though, means the link was mangled before it arrived.
  if (!token) {
    return (
      <>
        <AuthFormHeader
          description={authContent.resetPassword.description}
          heading={authContent.resetPassword.heading}
        />
        <Notice tone="error">{authContent.resetPassword.expired}</Notice>
        <Link
          className="mt-5 inline-block text-sm font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
          href="/forgot-password"
        >
          {authContent.forgotPassword.heading}
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthFormHeader
        description={authContent.resetPassword.description}
        heading={authContent.resetPassword.heading}
      />
      <ResetPasswordForm token={token} />
    </>
  );
}
