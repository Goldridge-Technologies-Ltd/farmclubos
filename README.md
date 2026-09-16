# FARMCLUB OS

The FARMCLUB OS monorepo: the public website, the web app, the API and the
design system they share.

CONNECT · EMPOWER · GROW

## Layout

| Path | What it is |
|---|---|
| `site/` | Public website (Next.js, static-first) |
| `webapp/` | Authenticated web app (Next.js), currently a scaffold |
| `api/` | Backend API (NestJS 12) |
| `packages/design-system/` | `@farmclub/design-system`: tokens, type roles, fonts, brand assets and core UI components |
| `docs/` | Design system, content rules and reference artwork; `docs/site/` holds the website's docs |

## Getting started

Install every workspace from the repository root (Node.js 20.9 or later):

```bash
npm install
```

Run an app:

```bash
npm run dev:site     # http://localhost:3000
npm run dev:webapp   # http://localhost:3001
npm run dev:api      # http://localhost:3002
```

The site's live design-system reference is at
[http://localhost:3000/design-system](http://localhost:3000/design-system).

## Quality checks

Each command runs in every workspace; add `--workspace <name>` for one.

```bash
npm run lint
npm run type-check
npm test
npm run build
```

## Working in the monorepo

- Add a dependency to one app with `npm install <package> --workspace webapp`.
  Keep the single lockfile at the root.
- Shared UI changes go in `packages/design-system/` and are documented in
  `docs/design-system.md`. See `AGENTS.md` for the full rules.
- Brand files live in `packages/design-system/brand/`. Each app copies them to
  its own `public/brand/` when `dev` or `build` runs.

## Deployment

Deploy each app as its own project with its root directory set to the app
(`site` or `webapp`). The host installs from the repository root, and the app's
`build` script runs `prebuild` first, which copies the brand files.
