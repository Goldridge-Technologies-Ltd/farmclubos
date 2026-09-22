import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { Notice } from "@farmclub/design-system/Notice";
import { AuthFormHeader } from "@/components/form/AuthFormHeader";
import { authContent, roleLabels } from "@/content/auth";
import { apiRequest } from "@/lib/api/client";
import type { InviteLookup } from "@/lib/api/contracts";
import { userMessage } from "@/lib/api/errors";
import { readAccessToken } from "@/lib/session";
import { AcceptInviteForm } from "./_components/AcceptInviteForm";
import { JoinInviteForm } from "./_components/JoinInviteForm";

export const metadata: Metadata = { title: "Accept your invitation" };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const unusable = authContent.acceptInvite.unusable;

  if (!token) {
    return <Unusable description={unusable.description} />;
  }

  let invite: InviteLookup;

  try {
    // The token travels in the body, never the URL, so it stays out of the
    // API's access logs.
    invite = await apiRequest<InviteLookup>("/api/invites/lookup", {
      method: "POST",
      authenticated: false,
      body: { token },
    });
  } catch (error) {
    // The API says precisely why — expired, withdrawn, already accepted — and
    // its wording is written for the person reading it.
    return <Unusable description={userMessage(error, unusable.description)} />;
  }

  /*
    The email already has an account, so this is someone joining a second
    institution rather than signing up. They have to be signed in as that
    account for the API to accept it.
  */
  if (invite.accountExists) {
    const signedIn = Boolean(await readAccessToken());
    const already = authContent.acceptInvite.alreadyHaveAccount;

    return (
      <>
        <AuthFormHeader
          description={already.description(invite.institution.name)}
          heading={already.heading}
        />
        {signedIn ? (
          <JoinInviteForm token={token} />
        ) : (
          <ButtonLink
            className="w-full"
            href={`/sign-in?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
            icon="none"
          >
            {already.signInLabel}
          </ButtonLink>
        )}
      </>
    );
  }

  return (
    <>
      <AuthFormHeader
        description={authContent.acceptInvite.description(
          invite.institution.name,
          roleLabels[invite.role] ?? "a member",
        )}
        heading={authContent.acceptInvite.heading(invite.institution.name)}
      />
      <AcceptInviteForm email={invite.email} token={token} />
    </>
  );
}

function Unusable({ description }: { description: string }) {
  const unusable = authContent.acceptInvite.unusable;

  return (
    <>
      <AuthFormHeader description="" heading={unusable.heading} />
      <Notice tone="error">{description}</Notice>
      <Link
        className="mt-5 inline-block text-sm font-semibold text-farm-green-800 transition-colors hover:text-farm-green-950"
        href="/sign-in"
      >
        {unusable.action}
      </Link>
    </>
  );
}
