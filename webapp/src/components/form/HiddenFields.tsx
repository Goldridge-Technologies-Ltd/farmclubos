/** What a one-button form posts besides the press itself: the ids its action needs. */
export function HiddenFields({ fields }: { fields: Record<string, string> }) {
  return Object.entries(fields).map(([name, value]) => (
    <input key={name} name={name} type="hidden" value={value} />
  ));
}
