import type { Metadata } from "next";
import { AuthFormHeader } from "@/components/form/AuthFormHeader";
import { authContent } from "@/content/auth";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthFormHeader
        description={authContent.forgotPassword.description}
        heading={authContent.forgotPassword.heading}
      />
      <ForgotPasswordForm />
    </>
  );
}
