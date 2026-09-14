"use client";

import { useMemo, useState } from "react";
import { Icon } from "@farmclub/design-system/Icon";
import { IconDisc } from "@farmclub/design-system/IconDisc";
import type { IconItem } from "@/content/pages/home";
import type { LearningPath } from "@/content/pages/knowledge";

type KnowledgeExplorerProps = {
  collections: IconItem[];
  paths: LearningPath[];
};

/*
  The reference shows a search field in the hero. There is no content API yet,
  so the field filters the published collections and learning-path topics on the
  client — a real, working search over everything the page actually holds.
*/

const words = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/*
  Matches on a short word stem so that a search for "finance" still finds
  "Financing & Investment". Tokens shorter than four characters must match a
  whole word prefix, which keeps very short queries from matching everything.
*/
function matches(haystack: string, query: string) {
  const target = words(haystack);
  const tokens = words(query);
  if (tokens.length === 0) return false;

  return tokens.every((token) => {
    const stem = token.length >= 4 ? token.slice(0, 4) : token;
    return target.some((word) => word.startsWith(stem));
  });
}

export function KnowledgeExplorer({
  collections,
  paths,
}: KnowledgeExplorerProps) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) return null;

    const collectionHits = collections.filter((item) =>
      matches(`${item.title} ${item.description}`, trimmed)
    );
    const topicHits = paths.flatMap((path) =>
      path.topics
        .filter((topic) => matches(`${topic} ${path.title}`, trimmed))
        .map((topic) => ({ topic, path: path.title }))
    );

    return { collectionHits, topicHits };
  }, [collections, paths, trimmed]);

  const total = results
    ? results.collectionHits.length + results.topicHits.length
    : 0;

  return (
    <div className="mt-8">
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="flex max-w-xl gap-2.5"
      >
        <div className="relative flex-1">
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-farm-muted"
          />
          <label htmlFor="knowledge-search" className="sr-only">
            Search knowledge collections and learning topics
          </label>
          <input
            id="knowledge-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search collections, guides and topics"
            aria-describedby="knowledge-search-status"
            className="min-h-12 w-full rounded-button border border-farm-border-strong bg-white pr-4 pl-11 text-sm text-farm-charcoal placeholder:text-farm-muted focus:border-farm-green-700"
          />
        </div>
      </form>

      <p
        id="knowledge-search-status"
        role="status"
        className="mt-2.5 text-xs text-farm-muted"
      >
        {trimmed
          ? `${total} ${total === 1 ? "match" : "matches"} for "${query.trim()}"`
          : "Searches the collections and learning topics on this page."}
      </p>

      {results && total > 0 ? (
        <div className="mt-5 grid gap-3 rounded-card border border-farm-border bg-white p-4">
          {results.collectionHits.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <IconDisc name={item.icon} tone="pale" size="sm" />
              <div>
                <p className="text-sm font-semibold text-farm-green-950">
                  {item.title}
                </p>
                <p className="text-xs text-farm-muted">{item.description}</p>
              </div>
            </div>
          ))}
          {results.topicHits.map(({ topic, path }) => (
            <div key={`${path}-${topic}`} className="flex items-center gap-3">
              <IconDisc name="learn" tone="pale" size="sm" />
              <div>
                <p className="text-sm font-semibold text-farm-green-950">
                  {topic}
                </p>
                <p className="text-xs text-farm-muted">Learning path: {path}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {results && total === 0 ? (
        <p className="mt-5 rounded-card border border-farm-border bg-white p-4 text-sm text-farm-muted">
          Nothing on this page matches that yet. Try &ldquo;finance&rdquo;,
          &ldquo;market&rdquo;, &ldquo;innovation&rdquo; or
          &ldquo;leadership&rdquo;.
        </p>
      ) : null}
    </div>
  );
}
