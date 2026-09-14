# FARMCLUB OS Website Instructions

The monorepo rules in `../AGENTS.md` always apply; this file adds the
website's. Paths below are relative to `site/` unless they start with `docs/`
or `packages/`, which are at the repository root.

## Project

`site/` is the official public website for FARMCLUB OS.

- Brief: `docs/site/project-brief.md`
- Page notes: `docs/site/page-notes.md`
- Asset manifest: `docs/site/asset-manifest.md`
- Screen briefs: `docs/site/screens/`

The website is static-first: no authentication, CMS or database. Forms
validate on the device and say plainly that nothing is sent. Authenticated
features belong in `webapp/`.

## Design

- Foundations: `docs/design-system.md`.
- Website page anatomy, components, section patterns and the new-screen
  recipe: `docs/site/design-patterns.md`.
- Before building a new page, write its brief from
  `docs/site/screens/_template.md`.
- Website-only components live in `components/`. When the web app needs one
  too, move it to `packages/design-system/components/` and document it in
  `docs/design-system.md`.
- The live reference is `/design-system` (`app/design-system/page.tsx`).

## Photography

Use website photography from:

`public/images`

## Homepage Requirements

Remove the partner and supporter section appearing below the Hub section in
the homepage reference.

Replace unsupported numerical impact claims with capability statements:

- Learning & Capacity Building
- Enterprise Development
- Innovation & Research
- Market Access
- Impact Intelligence

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
