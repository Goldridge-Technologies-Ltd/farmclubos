import { Icon } from "@farmclub/design-system/Icon";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqListProps = {
  items: FaqItem[];
};

/** Native <details> accordion — keyboard accessible with no client JavaScript. */
export function FaqList({ items }: FaqListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-card border border-farm-border bg-white px-5 py-4 open:shadow-card"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-medium text-farm-green-950 [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="shrink-0 text-farm-green-700 transition-transform duration-200 group-open:rotate-45"
            >
              <Icon name="plus" size={18} />
            </span>
          </summary>
          <p className="mt-3 type-body-sm text-farm-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
