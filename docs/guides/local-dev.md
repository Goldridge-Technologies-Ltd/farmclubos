# Local development

How to run FARMCLUB OS on your machine. Contribution rules are in
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Prerequisites

- **Node.js 22.x** (Next.js 16 needs 20.9 or later; development runs on 22)
- **npm 11** — ships with Node 22
- **Git**

## Setup

```bash
git clone git@github.com:Goldridge-Technologies-Ltd/farmclubos.git
cd farmclubos
npm install
```

Install from the repository root, always. There is one lockfile and one
`node_modules` for every workspace; running `npm install` inside an app would
create a second lockfile and break Turbopack's root detection. To add a
dependency to one app:

```bash
npm install <package> --workspace webapp
```

`npm install` also sets up the Git hooks, through the root `prepare` script.

## Running the apps

| App | Command (from the root) | URL |
|---|---|---|
| Website | `npm run dev:site` | http://localhost:3000 |
| Web app | `npm run dev:webapp` | http://localhost:3001 |
| API | `npm run dev:api` | http://localhost:3002 |

All three can run at once. The live design-system reference is at
http://localhost:3000/design-system, and the API's Swagger UI — available
outside production only — is at http://localhost:3002/api/docs.

Each front end copies the brand files from `packages/design-system/brand` into
its own `public/brand` when `dev` or `build` runs. Those copies are
gitignored — edit the originals. To refresh them by hand:

```bash
npm run sync-brand --workspace webapp
```

### The API is an ESM package

NestJS 12 ships ESM only, so `api/` sets `"type": "module"`. Relative imports
carry an explicit `.js` extension, type-only imports must use `import type`,
and Jest runs with `NODE_OPTIONS=--experimental-vm-modules` on Node 22 (the npm
scripts pass it). `api/AGENTS.md` has the detail.

## Checks

```bash
npm run lint
npm run type-check
npm test
npm run build
```

Each runs in every workspace; add `--workspace <name>` for one. Run them from
the root before opening a pull request.

## Git hooks

Installed with husky when you run `npm install`:

- **pre-commit** — for each workspace with staged changes, runs its lint,
  type-check and tests through `lint-staged`. A workspace that doesn't exist
  yet (such as `api/` before it is scaffolded) is skipped.
- **commit-msg** — checks the Conventional Commits format described in
  `CONTRIBUTING.md`.

Don't bypass them with `--no-verify`. If a hook is wrong, fix the hook.

## Environment variables

Never commit a `.env` file; `.env*` is gitignored. Copy the example file where
one exists and fill in your own values.

| Variable | Where | What it is |
|---|---|---|
| `NODE_ENV` | `api/.env` | `development`, `test` or `production`. Defaults to `development`. |
| `PORT` | `api/.env` | Port the API listens on. Defaults to `3002`. |
| `API_GLOBAL_PREFIX` | `api/.env` | Path prefix for every route except the health probes. Defaults to `api`. |
| `CORS_ORIGINS` | `api/.env` | Comma-separated browser origins allowed to call the API directly. Defaults to the two local front ends. |

The API validates its environment at boot, so a missing or malformed variable
stops the process on startup rather than failing on the first request that
needs it. Every variable lives in `api/src/config/env.validation.ts`.

Server-side secrets are read only in server code (`import "server-only"` in
the webapp, `ConfigService` in the API). Add each new variable to this table
in the same change that introduces it.

## Not set up yet

These arrive in later steps, and this guide is updated in the same change:

- PostgreSQL and Prisma, including how to run migrations and seed data
- `docker-compose.yml` for a local Postgres, and the Supabase alternative
- The webapp's `src/lib/api/client.ts` and the API base URL it reads

## Troubleshooting

- **`type-check` fails right after cloning.** `next-env.d.ts` is gitignored
  and regenerated; the `type-check` script runs `next typegen` first, so run
  it through npm rather than calling `tsc` directly.
- **Logo or favicon missing in an app.** The brand files weren't copied; run
  `npm run sync-brand --workspace <app>`.
- **A shared component's Tailwind classes don't apply.** Tailwind skips
  `node_modules`, so `packages/design-system/styles/theme.css` carries
  `@source "../components"`. A new folder in the package needs its own
  `@source` line.
