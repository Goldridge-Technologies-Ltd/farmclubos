# Local development

How to run FARMCLUB OS on your machine. Contribution rules are in
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Prerequisites

- **Node.js 22.x** (Next.js 16 needs 20.9 or later; development runs on 22)
- **npm 10** — ships with Node 22
- **Git**
- **A PostgreSQL database**: a Supabase project, or Docker for the local one in
  `docker-compose.yml` (see [Database](#database))

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

Then create the two environment files from their examples:

```bash
cp api/.env.example api/.env
cp webapp/.env.example webapp/.env.local
```

`api/.env` needs three values before the API will start — `DATABASE_URL` (see
[Database](#database)), and `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, two
different values each from `openssl rand -base64 32`. Every variable is in the
[table below](#environment-variables). `webapp/.env.local` works as copied.

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

### Health probes

`GET /health` says the process is up. `GET /health/ready` says whether it can
serve traffic, and answers **503** when a dependency is unreachable, naming it
in `error.details` — load balancers, Render and Docker read the status code,
not the body, so a 200 saying "degraded" would keep sending traffic to a
broken instance.

Both sit outside the `/api` prefix and need no token, so a probe does not have
to know either. The API starts even when the database is unreachable and
reports not-ready until it returns, so a transient outage does not fail a
deploy.

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
npm run test:e2e --workspace api
npm run build
```

Each runs in every workspace; add `--workspace <name>` for one. Run them from
the root before opening a pull request. `test:e2e` drives the API's HTTP
contracts through Supertest with the database stubbed, so it needs no
connection.

## Git hooks

Installed with husky when you run `npm install`:

- **pre-commit** — for each workspace with staged changes, runs its lint,
  type-check and tests through `lint-staged`. They check the whole workspace
  as it is on disk, unstaged edits included, so a commit that leaves part of a
  change unstaged is not proven to build on its own.
- **commit-msg** — checks the Conventional Commits format described in
  `CONTRIBUTING.md`.
- **pre-commit** also scans every staged file for credentials, so a real value
  cannot reach a committed `.env.example`. See "Secrets" in `CONTRIBUTING.md`.

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
| `JWT_ACCESS_SECRET` | `api/.env` | **Required**, 32+ characters. Signs access tokens. Generate with `openssl rand -base64 32`. |
| `JWT_REFRESH_SECRET` | `api/.env` | **Required**, 32+ characters, and different from `JWT_ACCESS_SECRET`. Keys the HMAC that derives each rotated refresh token. |
| `ACCESS_TOKEN_TTL_SECONDS` | `api/.env` | Access token lifetime. Defaults to `900` (15 minutes). Anything a token carries, such as the institution role, can be this stale. |
| `REFRESH_TOKEN_TTL_DAYS` | `api/.env` | How long a session lasts without use. Defaults to `30`. |
| `REFRESH_REUSE_GRACE_SECONDS` | `api/.env` | How long a just-rotated refresh token is still honoured, so concurrent requests are not mistaken for theft. Defaults to `30`. |
| `PASSWORD_RESET_TTL_MINUTES` | `api/.env` | Reset link lifetime. Defaults to `60`. |
| `INVITE_TTL_HOURS` | `api/.env` | Invitation link lifetime. Defaults to `168` (seven days). |
| `LOGIN_MAX_FAILURES` | `api/.env` | Failed sign-ins allowed per account inside the window before it is blocked. Defaults to `8`. A forwarded client address gets ten times this. |
| `LOGIN_THROTTLE_WINDOW_SECONDS` | `api/.env` | How long failed sign-ins are counted, and how long a block then lasts. Defaults to `900` (15 minutes). |
| `PASSWORD_RESET_MAX_REQUESTS` | `api/.env` | Reset emails allowed per email address inside the window. Defaults to `5`. A forwarded client address gets ten times this. |
| `PASSWORD_RESET_THROTTLE_WINDOW_SECONDS` | `api/.env` | The reset window, and the length of the block. Defaults to `3600` (one hour). |
| `API_BASE_URL` | `webapp/.env.local` | Where the web app reaches the API. **Server-only**, not `NEXT_PUBLIC_`: the browser never calls the API. Defaults to nothing — the app fails with a clear message if it is unset. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_FIRST_NAME`, `SEED_ADMIN_LAST_NAME` | `api/.env` | Seed only — the API never reads them. Create the first platform admin; the names are optional. See below. |
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

### Your first platform admin

Nobody can be invited until someone can sign in, so the seed creates the first
platform admin from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (10 characters
or more). Add both to `api/.env`, then:

```bash
npm run db:seed --workspace api
```

Sign in at http://localhost:3001/sign-in. The seed refuses to create an admin
in production, and re-running it never changes an existing account's password.

### Throttling sign-in

Sign-in and password-reset attempts are counted in the `RateLimitCounter`
table, not in memory, so the limit holds across restarts and across more than
one API instance. Sign-in counts **failures** — a correct password clears the
tally — while a password reset counts every request, because there the request
itself is the cost.

Counting is keyed on the **account**, not the caller's address. Behind the BFF
every request reaches the API from the web app's own address, so an address
alone would either throttle everybody at once or nobody. The address is used as
a second key only when the web app forwards one (`x-forwarded-for`), which is
what happens in production behind a proxy; locally there is nothing to forward
and the account key does the work.

The two budgets are deliberately different. An address is shared — a campus, an
office, a phone network all reach the internet through one — so it runs on ten
times the account's allowance: enough to cap a spray across many accounts from
a single host, loose enough that one careless afternoon in a computer lab does
not lock out the building. A forwarded address is also spoofable, so it only
ever supplements the account key; it can never be used to get past it.

Keys are stored as SHA-256 hashes. The table would otherwise fill with every
email anyone ever typed at the sign-in form, including the ones that do not
exist — an attacker's spray list, sitting in the database.

A blocked attempt answers `429` with a `Retry-After` header and
`error.details.retryAfterSeconds`. To try the limit locally, post a wrong
password to `/api/auth/login` nine times:

```bash
for i in $(seq 1 9); do
  curl -s -o /dev/null -w '%{http_code} ' -X POST http://localhost:4000/api/auth/login \
    -H 'content-type: application/json' \
    -d '{"email":"you@example.com","password":"wrong"}'
done
# 401 401 401 401 401 401 401 401 429
```

Clear it with `DELETE FROM "RateLimitCounter";`, or wait out the window.

### Row-level security

Supabase serves the `public` schema over HTTPS through PostgREST, so a table
created by Prisma with RLS off is readable by anyone holding the project's anon
key, without ever touching the API. The `enable_row_level_security` migration
turns RLS on for every table with **no policies** and revokes the `anon` and
`authenticated` grants. The API is unaffected — it connects as the table owner,
which bypasses RLS — and so does the Supabase Studio table editor.

**A new table needs the same treatment in a follow-up migration.**

## Walking the whole journey

The seed creates the catalogue but no institution, cohort or enrolment — that
is deliberate, and it means a fresh database has nobody to enrol. Every step
happens in the web app, starting from the platform administrator the seed
creates (see *Your first platform admin* above).

1. Sign in as the platform administrator. The sidebar has a **Platform**
   group: **Institutions** → *Add an institution*, then on the institution,
   invite the person who will run it. With `MAIL_DRIVER=log` the invitation
   link is printed in the API console.
2. That person opens the link and sets a name and password. They are now the
   institution's administrator, and their sidebar has a **Manage** group:
   *Members* and *Cohorts*.
3. **Members** → invite someone as a Learner. They get an email; with
   `MAIL_DRIVER=log` the link is printed in the API console instead.
4. The learner opens the link, sets a name and password, and lands on their
   dashboard, which says they are not enrolled yet.
5. **Cohorts** → *Open a new intake* → choose a pathway and a name. It opens
   on the new cohort.
6. On the cohort, choose the learner under *Enrol a member*. They appear in the
   list at 0%.
7. As the learner, the dashboard now shows the pathway and a *Continue*
   button. Mark the lesson complete, then *Start the assessment* on
   *Fundamentals of Agriculture*, answer, and submit.
8. The learner's */my-journey* and the administrator's cohort page both show
   the same progress.

Only *Fundamentals of Agriculture* has a published assessment — the rest are
drafts — so it is the one place the quiz appears.

## Known issues

- **`npm audit` reports 4 high-severity advisories** (`mysql2`,
  `deepmerge-ts`). Both reach us only through the Prisma **CLI**, which is a
  devDependency, so neither ships to production. Neither code path is
  reachable: `mysql2` is only used when targeting MySQL, and `deepmerge-ts`
  merges our own `prisma.config.ts`. `npm audit fix --force` would downgrade to
  Prisma 6, a breaking change. `overrides` do not take effect on npm 10.9.4
  here, and forcing the patched versions breaks the CLI. Revisit when Prisma
  bumps its pins.

## Testing the API in Swagger

Open http://localhost:4000/api/docs. Every route needs a bearer access token
unless it is public — the API is secure by default.

1. Call `POST /api/auth/login` and copy `data.accessToken` from the response.
2. Click **Authorize** and paste the token.
3. Protected routes now work until the token expires (15 minutes by default);
   call `POST /api/auth/refresh` with `data.refreshToken` for a new pair.

Swagger talks to the API directly. The web app never does: it holds the tokens
in its own httpOnly cookies and calls the API server-to-server.

### Onboarding an institution through the API

The web app does this now — see [Walking the whole journey](#walking-the-whole-journey).
These are the same steps against the API directly, for testing it on its own:

1. Sign in as the platform admin and authorise Swagger with the access token.
2. `POST /api/institutions` creates the institution.
3. `POST /api/institutions/{institutionId}/invites` with `role:
   INSTITUTION_ADMIN` invites its first admin.
4. With `MAIL_DRIVER=log`, the invitation email — link included — prints in the
   terminal running `npm run dev:api`. Copy the `token` from its
   `accept-invite?token=…` link.
5. `POST /api/invites/lookup` with that token shows what the invitee will see;
   `POST /api/invites/accept` creates their account and signs them in.
6. Authorise as the new institution admin to invite learners the same way.

An invitee who already has an account signs in and calls `POST
/api/invites/join` instead; `lookup` reports `accountExists: true` for them.

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
