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
| API | `npm run dev:api` | http://localhost:4000 |

All three can run at once. The live design-system reference is at
http://localhost:3000/design-system, and the API's Swagger UI — available
outside production only — is at http://localhost:4000/api/docs.

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
| `PORT` | `api/.env` | Port the API listens on. Defaults to `4000`. |
| `API_GLOBAL_PREFIX` | `api/.env` | Path prefix for every route except the health probes. Defaults to `api`. |
| `CORS_ORIGINS` | `api/.env` | Comma-separated browser origins allowed to call the API directly. Defaults to the two local front ends. |
| `DATABASE_URL` | `api/.env` | PostgreSQL connection the running API uses. **Required** — the API will not boot without it. |
| `DIRECT_URL` | `api/.env` | Optional. The connection the Prisma CLI uses for migrations, when it differs from `DATABASE_URL`. |
| `DATABASE_POOL_MAX` | `api/.env` | Connections held open by the pg pool. Defaults to `10`. |
| `WEBAPP_URL` | `api/.env` | Base URL that links in emails point to — the web app, never the API. Defaults to `http://localhost:3001`. |
| `MAIL_DRIVER` | `api/.env` | `log` (default) writes each email, links included, to the API console. `smtp` sends for real. **Production refuses `log`**, which would put invite and reset links in the logs. |
| `MAIL_FROM` | `api/.env` | The sender. Defaults to `FARMCLUB OS <no-reply@farmclubos.com>`. |
| `SMTP_HOST` | `api/.env` | Required when `MAIL_DRIVER=smtp`. |
| `SMTP_PORT` | `api/.env` | Defaults to `587`. |
| `SMTP_USER`, `SMTP_PASSWORD` | `api/.env` | Optional; omit both for an SMTP server without authentication, such as Mailpit. |
| `SMTP_SECURE` | `api/.env` | `true` for implicit TLS (usually port 465); `false` (default) upgrades with STARTTLS. |

The API validates its environment at boot, so a missing or malformed variable
stops the process on startup rather than failing on the first request that
needs it. Every variable lives in `api/src/config/env.validation.ts`.

Server-side secrets are read only in server code (`import "server-only"` in
the webapp, `ConfigService` in the API). Add each new variable to this table
in the same change that introduces it.

## Database

The API uses PostgreSQL through Prisma 7. Either backend works, and only
`DATABASE_URL` changes between them.

**Supabase (what the project uses today).** Take the connection string from the
project's **Connect** dialog, **Session pooler** row — port 5432. That one
string serves both the running API and migrations. The transaction pooler
(port 6543) is runtime-only: migrations run DDL and take advisory locks, which
it cannot carry, so set `DIRECT_URL` to the session URL if you use it.

**Local Postgres**, for working offline or to match a VPS deployment:

```bash
docker compose up -d postgres
# then in api/.env:
# DATABASE_URL=postgresql://farmclub:farmclub@localhost:5432/farmclub
```

Commands, all from the repository root:

```bash
npm run db:migrate --workspace api    # create and apply a migration
npm run db:deploy  --workspace api    # apply pending migrations (deployment)
npm run db:status  --workspace api    # what is applied, what is pending
npm run db:seed    --workspace api    # seed the Academy catalogue
npm run db:studio  --workspace api    # browse the data
```

`prisma generate` writes the client into `api/src/generated/prisma`, which is
gitignored. `type-check` and `prebuild` run it first, so a fresh clone works
before anything is generated — and it needs no database connection.

### Row-level security

Supabase serves the `public` schema over HTTPS through PostgREST, so a table
created by Prisma with RLS off is readable by anyone holding the project's anon
key, without ever touching the API. The `enable_row_level_security` migration
turns RLS on for every table with **no policies** and revokes the `anon` and
`authenticated` grants. The API is unaffected — it connects as the table owner,
which bypasses RLS — and so does the Supabase Studio table editor.

**A new table needs the same treatment in a follow-up migration.**

## Known issues

- **`npm audit` reports 4 high-severity advisories** (`mysql2`,
  `deepmerge-ts`). Both reach us only through the Prisma **CLI**, which is a
  devDependency, so neither ships to production. Neither code path is
  reachable: `mysql2` is only used when targeting MySQL, and `deepmerge-ts`
  merges our own `prisma.config.ts`. `npm audit fix --force` would downgrade to
  Prisma 6, a breaking change. `overrides` do not take effect on npm 10.9.4
  here, and forcing the patched versions breaks the CLI. Revisit when Prisma
  bumps its pins.

## Not set up yet

These arrive in later steps, and this guide is updated in the same change:

- The API's authentication variables, including the JWT signing secrets
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
