@AGENTS.md

# Farmclubos Webapp

Next.js 16 project using the App Router, React Server Components, TypeScript and the `src/` directory.

## Role

You are a senior Next.js developer. Always apply Next.js App Router patterns and architecture decisions, not generic React or single-page-app approaches.

## Design system

- App UI follows `docs/design-system.md` (loaded by the root `CLAUDE.md`) and imports shared components from `@farmclub/design-system/<Name>`.
- Don't restyle or re-create a shared component locally. If one is missing or needs a new variant, add it to `packages/design-system/` following the root `CLAUDE.md`.

## Project structure

All application code lives in `src/`. Config files (`next.config.ts`, `tsconfig.json`, `package.json`) and `public/` stay at the `webapp/` root.

- `src/app/` — routes only. Use route groups `(group)` to organise features without changing URLs. Route-specific components sit next to their route in a private `_components/` folder.
- `src/components/` — components shared across routes.
- `src/lib/` — integrations and utilities.
- `src/hooks/` — client hooks.
- `src/proxy.ts` — request interception (Next.js 16 replaced `middleware.ts` with `proxy.ts`).
- Import from `src/` with the `@/` alias (e.g. `@/lib/api/client`), not long relative paths.

## Server and client components

- Components are Server Components by default. Only add `"use client"` when a component needs state, effects, event handlers or browser APIs.
- Leaf components: push `"use client"` as far down the tree as possible. Pages, layouts and data-loading sections stay on the server; only the small interactive piece (a button, a form, a toggle) becomes a client component.
- Never mark a page or layout `"use client"` to make one child interactive — extract that child into its own client component instead.
- To render server content inside a client component, pass it as `children` or a prop rather than importing a Server Component into a client file.
- Props passed from server to client components must be serializable: plain objects, arrays, primitives and Dates are fine; functions (other than Server Actions) and class instances are not.
- Keep client components free of data fetching where possible; fetch on the server and pass the data down.

## Code standards

- Fetch data in Server Components, Route Handlers or Server Actions — not in `useEffect`.
- `params` and `searchParams` are Promises in Next.js 16; `await` them in pages, layouts and route handlers.
- Use Server Actions for mutations and validate their input on the server. After a write, call `updateTag()` when the user should see their change immediately, or `revalidateTag(tag, 'max')` / `revalidatePath()` otherwise. Always pass the second argument to `revalidateTag`.
- Never create API or SDK clients inline in components. Each integration gets one module in `src/lib/` (e.g. `src/lib/api/client.ts` for calls to `api/`) that the rest of the app imports.
- Server-only modules (secrets, tokens, the API client) start with `import "server-only"`. Only `NEXT_PUBLIC_` variables may be read in client code.
- Every route segment that loads data gets a `loading.tsx` and `error.tsx`; use `notFound()` for missing resources.
- Use `next/link`, `next/image` and `next/font` instead of raw `<a>`, `<img>` and font imports. Set page titles and descriptions with the Metadata API.
- Don't put business logic in the webapp that belongs in `api/`; the webapp calls the API through `src/lib/api/client.ts`.
- The API wraps every response in `{ success, data, meta }`, and failures in `{ success, error }`. Unwrap that once in `src/lib/api/client.ts` so the rest of the app works with plain data.

## Testing

- Test sparingly, and only where a test earns its place: logic that can break
  silently, such as form validation, permission-dependent rendering or data
  shaping in `src/lib/`. Don't test markup, styling or wiring, and don't
  retest shared components already covered in `packages/design-system/`.
- Jest with React Testing Library is the setup, added when the first case
  appears. Do not introduce Vitest or a second runner.
- Test behaviour through the rendered UI rather than implementation details.

