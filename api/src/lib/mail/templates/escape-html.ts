const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapes text for HTML element content and quoted attributes. Every value an
 * email template did not write itself — names, institution names, links —
 * passes through here, because an institution name is user-supplied input.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ENTITIES[character]);
}
