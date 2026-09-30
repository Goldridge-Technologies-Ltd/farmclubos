/** Long enough to read, short enough to share. */
const MAX_LENGTH = 80;

/**
 * The slug a module or lesson takes from its title: lower-case words joined
 * by dashes, accents dropped, numbered when a sibling already has it. `kind`
 * stands in for a title with no letters or digits at all.
 */
export function slugFor(title: string, kind: string, taken: ReadonlySet<string>): string {
  const base =
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, MAX_LENGTH)
      .replace(/^-+|-+$/g, "") || kind;

  if (!taken.has(base)) {
    return base;
  }

  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;

    if (!taken.has(candidate)) {
      return candidate;
    }
  }
}
