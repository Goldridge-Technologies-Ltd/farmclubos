import Link from "next/link";
import { Fragment } from "react";
import { parseNotes, type Inline } from "@/lib/notes";

/*
  Lesson notes, rendered with the design system's type. The text arrives as
  written; parseNotes turns it into blocks and nothing here ever treats it as
  HTML, so the worst a stray bracket can do is show.

  Headings start at h3: the lesson is the page's h1 and each scene an h2.
*/
export function NotesView({ source }: { source: string }) {
  return (
    <div className="grid gap-4">
      {parseNotes(source).map((block, index) => {
        switch (block.type) {
          case "heading":
            return block.level === 3 ? (
              <h3 key={index} className="mt-2 text-lg font-semibold text-farm-green-950">
                <Inlines items={block.children} />
              </h3>
            ) : (
              <h4 key={index} className="mt-1 text-base font-semibold text-farm-green-950">
                <Inlines items={block.children} />
              </h4>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";

            return (
              <List
                key={index}
                className={`grid gap-1.5 pl-6 type-body text-farm-charcoal ${
                  block.ordered ? "list-decimal" : "list-disc"
                }`}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Inlines items={item} />
                  </li>
                ))}
              </List>
            );
          }
          default:
            return (
              <p key={index} className="type-body text-farm-charcoal">
                <Inlines items={block.children} />
              </p>
            );
        }
      })}
    </div>
  );
}

function Inlines({ items }: { items: Inline[] }) {
  return items.map((item, index) => {
    switch (item.type) {
      case "strong":
        return (
          <strong key={index} className="font-semibold text-farm-green-950">
            <Inlines items={item.children} />
          </strong>
        );
      case "em":
        return (
          <em key={index}>
            <Inlines items={item.children} />
          </em>
        );
      case "link":
        return (
          <Link
            key={index}
            className="font-semibold text-farm-green-800 underline underline-offset-2 transition-colors hover:text-farm-green-950"
            href={item.href}
          >
            <Inlines items={item.children} />
          </Link>
        );
      default:
        return <Fragment key={index}>{item.text}</Fragment>;
    }
  });
}
