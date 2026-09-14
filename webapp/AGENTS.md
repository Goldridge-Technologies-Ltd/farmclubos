# FARMCLUB OS Web App Instructions

The monorepo rules in `../AGENTS.md` always apply; this file adds the web
app's. Paths below are relative to `webapp/` unless they start with `docs/` or
`packages/`, which are at the repository root.

## Project

`webapp/` is the authenticated FARMCLUB OS application. It will grow to cover
the product scope in `docs/site/project-brief.md` ("Initial Product Scope"):
authentication, user profiles, learning programmes, enterprise tools,
innovation challenges, market connections, finance applications,
institutional dashboards, impact reporting and administrative tools.

It is currently a scaffold: one placeholder page that proves the shared
tokens, fonts, brand assets and components load. It runs on port 3001.

## Design

- Follow `docs/design-system.md`. Import shared components from
  `@farmclub/design-system/<Name>`; never copy them into the app or redefine
  tokens.
- The website's section patterns (`docs/site/design-patterns.md`) are
  marketing layouts. Don't use them for app screens unless a screen really is
  a marketing page.
- App patterns (app shell, navigation, tables, dashboards, empty, loading and
  error states) don't exist yet. Build app-only components in `components/`,
  and shared ones in `packages/design-system/components/` when the site could
  use them too. Document app patterns in `docs/webapp/design-patterns.md` once
  the first ones exist, and shared components in `docs/design-system.md` §10.
- Forms follow `docs/design-system.md` §11. Unlike the website's, app forms
  submit for real, so every one needs busy, error and success states.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
