/*
  Installs the Git hooks, run by the root `prepare` script after every
  `npm install`.

  npm runs the root's `prepare` even when it installed one workspace only, as
  it does inside an app folder: Vercel installs from `webapp/` or `site/`, its
  Root Directory. The root's devDependencies, husky among them, are not
  installed then, so calling `husky` directly fails the install with "command
  not found". A deployment needs no Git hooks, so without husky this does
  nothing.
*/
try {
  const { default: husky } = await import("husky");
  console.log(husky());
} catch (error) {
  if (error?.code !== "ERR_MODULE_NOT_FOUND") {
    throw error;
  }
}
