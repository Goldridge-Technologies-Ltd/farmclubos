import { authContent } from "@/content/auth";

/*
  What someone signing themselves up agrees to. The API records when they
  accepted, on the account it makes. The documents live on the public site,
  so they open in a new tab rather than taking the person off the form.
*/
export function TermsNotice() {
  const terms = authContent.terms;
  const link =
    "font-semibold text-farm-green-800 underline underline-offset-2 transition-colors hover:text-farm-green-950";

  return (
    <p className="type-caption text-farm-muted">
      {terms.lead}{" "}
      <a className={link} href={terms.termsOfService.href} rel="noopener noreferrer" target="_blank">
        {terms.termsOfService.label}
        <span className="sr-only"> {terms.newTab}</span>
      </a>{" "}
      {terms.and}{" "}
      <a className={link} href={terms.privacyPolicy.href} rel="noopener noreferrer" target="_blank">
        {terms.privacyPolicy.label}
        <span className="sr-only"> {terms.newTab}</span>
      </a>
      .
    </p>
  );
}
