import type { Metadata } from "next";
import { AuthFormHeader } from "@/components/form/AuthFormHeader";
import { authContent } from "@/content/auth";
import { SignUpForm } from "./_components/SignUpForm";

export const metadata: Metadata = { title: "Create your account" };

/*
  Signing up on one's own, without an institution. Only the email is asked
  for here: the emailed link opens the page where the person adds their name
  and chooses a password, as an invited person does.
*/
export default function SignUpPage() {
  return (
    <>
      <AuthFormHeader
        description={authContent.signUp.description}
        heading={authContent.signUp.heading}
      />
      <SignUpForm />
    </>
  );
}
