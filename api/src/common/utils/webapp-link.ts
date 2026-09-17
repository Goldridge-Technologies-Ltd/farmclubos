/**
 * A link into the web app, for emails. Built by joining rather than with
 * `new URL(path, base)`, which would drop any path already on the base URL.
 */
export function webappLink(
  baseUrl: string,
  path: string,
  params: Record<string, string> = {},
): string {
  const query = new URLSearchParams(params).toString();

  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}${query ? `?${query}` : ""}`;
}
