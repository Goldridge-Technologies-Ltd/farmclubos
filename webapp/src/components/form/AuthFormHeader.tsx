/*
  The heading and lead of an auth screen. One h1 per page: the screen's
  heading is it.
*/
export function AuthFormHeader({
  heading,
  description,
}: {
  heading: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="type-h2-band text-farm-green-950">{heading}</h1>
      <p className="mt-3 type-body-sm text-farm-muted">{description}</p>
    </header>
  );
}
