# FARMCLUB OS Web App Instructions

The monorepo rules in `../AGENTS.md` always apply; this file adds the web
app's. Paths below are relative to `webapp/` unless they start with `docs/` or
`packages/`, which are at the repository root.

## Project

`webapp/` is the authenticated FARMCLUB OS application: a Next.js 16 project
using the App Router, React Server Components and TypeScript. It will grow to
cover the product scope in `docs/site/project-brief.md` ("Initial Product
Scope"): authentication, user profiles, learning programmes, enterprise tools,
innovation challenges, market connections, finance applications,
institutional dashboards, impact reporting and administrative tools.

It is currently a scaffold: one placeholder page that proves the shared
tokens, fonts, brand assets and components load. It runs on port 3001.

Apply Next.js App Router patterns and architecture decisions, not generic
React or single-page-app approaches.

## Project structure

All application code lives in `src/`. Config files (`next.config.ts`,
`tsconfig.json`, `package.json`) and `public/` stay at the `webapp/` root.

- `src/app/` — routes only. Use route groups `(group)` to organise features
  without changing URLs. Route-specific components sit next to their route in
  a private `_components/` folder.
- `src/components/` — components shared across routes.
- `src/lib/` — integrations and utilities.
- `src/hooks/` — client hooks.
- `src/proxy.ts` — request interception (Next.js 16 replaced `middleware.ts`
  with `proxy.ts`).
- Import from `src/` with the `@/` alias (for example `@/lib/api/client`), not
  long relative paths.

## Design

- Follow `docs/design-system.md`. Import shared components from
  `@farmclub/design-system/<Name>`; never copy them into the app or redefine
  tokens.
- Don't restyle or re-create a shared component locally. If one is missing or
  needs a new variant, add it to `packages/design-system/` and document it in
  `docs/design-system.md` §10.
- The website's section patterns (`docs/site/design-patterns.md`) are
  marketing layouts. Don't use them for app screens unless a screen really is
  a marketing page.
- App patterns (app shell, navigation, tables, dashboards, empty, loading and
  error states) don't exist yet. Build app-only components in
  `src/components/`, and shared ones in `packages/design-system/components/`
  when the site could use them too. Document app patterns in
  `docs/webapp/design-patterns.md` once the first ones exist.
- Forms follow `docs/design-system.md` §11. Unlike the website's, app forms
  submit for real, so every one needs busy, error and success states.

## Server and client components

- Components are Server Components by default. Only add `"use client"` when a
  component needs state, effects, event handlers or browser APIs.
- Leaf components: push `"use client"` as far down the tree as possible. Pages,
  layouts and data-loading sections stay on the server; only the small
  interactive piece (a button, a form, a toggle) becomes a client component.
- Never mark a page or layout `"use client"` to make one child interactive —
  extract that child into its own client component instead.
- To render server content inside a client component, pass it as `children` or
  a prop rather than importing a Server Component into a client file.
- Props passed from server to client components must be serializable: plain
  objects, arrays, primitives and Dates are fine; functions (other than Server
  Actions) and class instances are not.
- Keep client components free of data fetching where possible; fetch on the
  server and pass the data down.

## Code standards

- Fetch data in Server Components, Route Handlers or Server Actions — not in
  `useEffect`.
- `params` and `searchParams` are Promises in Next.js 16; `await` them in
  pages, layouts and route handlers.
- Use Server Actions for mutations and validate their input on the server.
  After a write, call `updateTag()` when the user should see their change
  immediately, or `revalidateTag(tag, 'max')` / `revalidatePath()` otherwise.
  Always pass the second argument to `revalidateTag`.
- Never create API or SDK clients inline in components. Each integration gets
  one module in `src/lib/` (for example `src/lib/api/client.ts` for calls to
  `api/`) that the rest of the app imports.
- Server-only modules (secrets, tokens, the API client) start with
  `import "server-only"`. Only `NEXT_PUBLIC_` variables may be read in client
  code.
- Every route segment that loads data gets a `loading.tsx` and `error.tsx`;
  use `notFound()` for missing resources.
- Use `next/link`, `next/image` and `next/font` instead of raw `<a>`, `<img>`
  and font imports. Set page titles and descriptions with the Metadata API.
- Don't put business logic in the webapp that belongs in `api/`; the webapp
  calls the API through `src/lib/api/client.ts`.
- The API wraps every response in `{ success, data, meta }`, and failures in
  `{ success, error }`. Unwrap that once in `src/lib/api/client.ts` so the rest
  of the app works with plain data.

## Testing

- Test sparingly, and only where a test earns its place: logic that can break
  silently, such as form validation, permission-dependent rendering or data
  shaping in `src/lib/`. Don't test markup, styling or wiring, and don't
  retest shared components already covered in `packages/design-system/`.
- Jest with React Testing Library is the setup, added when the first case
  appears. Do not introduce Vitest or a second runner.
- Test behaviour through the rendered UI rather than implementation details.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
