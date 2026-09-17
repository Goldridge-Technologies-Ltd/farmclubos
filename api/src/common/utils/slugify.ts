/**
 * A URL-safe slug from a display name: lower-case ASCII letters, digits and
 * single hyphens. Accents are folded ("Université" → "universite"); anything
 * else becomes a separator.
 */
export function slugify(value: string, maxLength = 60): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");

  return slug || "institution";
}
