# FARMCLUB OS

The FARMCLUB OS monorepo: the public website, the web app, the API and the
design system they share.

CONNECT · EMPOWER · GROW

## Layout

| Path | What it is |
|---|---|
| `site/` | Public website (Next.js, static-first) |
| `webapp/` | The authenticated web app (Next.js): the Academy and the screens its content is built from, learner progress, and the screens institutions and the platform are run from |
| `api/` | Backend API (NestJS 12, Prisma 7, PostgreSQL; lesson media in a local folder or S3-compatible storage) |
| `packages/design-system/` | `@farmclub/design-system`: tokens, type roles, fonts, brand assets and core UI components |
| `docs/` | Design system and content rules; `docs/site/` and `docs/webapp/` for each front end; `docs/guides/` for developer guides |

## First run

You need Node.js 22 and a PostgreSQL database — either a Supabase project or
the local one in `docker-compose.yml`. The full walkthrough, with every
environment variable explained, is
[`docs/guides/local-dev.md`](docs/guides/local-dev.md).

```bash
npm install                                 # every workspace, from the root

cp api/.env.example api/.env                # then fill it in — see below
cp webapp/.env.example webapp/.env.local

docker compose up -d postgres               # only if you are not using Supabase
npm run db:deploy --workspace api           # create the tables
npm run db:seed   --workspace api           # the Academy catalogue, and your first admin
```

Lesson videos and files need nothing more: the API keeps them in
`api/.storage/` until you switch `STORAGE_DRIVER` to `s3` for RustFS or R2
(see the guide).

In `api/.env`, three values have no default:

- `DATABASE_URL` — Supabase's **Session pooler** connection string (port 5432),
  or `postgresql://farmclub:farmclub@localhost:5432/farmclub` for Docker.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — two different values, each
  from `openssl rand -base64 32`.

Add `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before seeding, and the seed
creates the first platform administrator. Nobody else can be invited until
someone can sign in.

Then run the apps:

```bash
npm run dev:api      # http://localhost:4000 — Swagger at /api/docs
npm run dev:webapp   # http://localhost:3001 — sign in here
npm run dev:site     # http://localhost:3000 — design-system reference at /design-system
```

Sign in to the web app as that administrator. **Platform → Institutions** is
where the rest begins: add an institution, invite the person who runs it, and
they invite and enrol their learners. **Content → Academy content** is where
lessons are built, from videos and notes, and **Platform → Content team** is
where you invite the content managers who build them with you.

## Quality checks

Each command runs in every workspace; add `--workspace <name>` for one.

```bash
npm run lint
npm run type-check
npm test
npm run test:e2e --workspace api   # the API's HTTP contracts
npm run build
```

The pre-commit hook runs lint, type-check and tests for each workspace a commit
touches, and refuses anything that looks like a credential. Branch, commit and
review rules are in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Working in the monorepo

- Add a dependency to one app with `npm install <package> --workspace webapp`.
  Keep the single lockfile at the root.
- Shared UI changes go in `packages/design-system/` and are documented in
  `docs/design-system.md`. See `AGENTS.md` for the full rules.
- Brand files live in `packages/design-system/brand/`. Each app copies them to
  its own `public/brand/` when `dev` or `build` runs.

## Deployment

**Front ends, on Vercel.** Each app is its own Vercel project, deployed from
Git. In each project's **Build and Deployment** settings:

- **Root Directory:** the app, `webapp` or `site`.
- **Include files outside the root directory in the Build Step:** on, as it
  is by default. The design system lives in `packages/`; without it npm looks
  for `@farmclub/design-system` on the public registry, and the install fails
  with a 404.
- **Install Command and Build Command:** leave both on their defaults. Vercel
  runs `npm install` inside the app, which installs that app and the packages
  it uses rather than the whole repository, and the root's `prepare` script
  skips the Git hooks, since husky is not installed then. `npm run build`
  runs `prebuild` first, which copies the brand files.
- **Vercel CLI:** run it from the repository root, never from inside an app
  folder, which leaves the rest of the repository behind.

The web app needs `API_BASE_URL` in the project's environment variables: the
API's `https://` origin, without `/api` (`https://api.example.com`). Set it for
Production, and for Preview only if previews may use that API's real data.
HTTPS is required, since the session cookies are `secure` in production, and
Vercel provides it. Every page reads from the API, so set the project's
function region (**Settings → Functions**) to the one nearest the API. The
API needs the web app's address too, in `WEBAPP_URL` and the bucket's CORS
rule (below).

**API.** Whatever the host, a deploy is the same four steps, from the
repository root:

```bash
npm install
npm run build --workspace api       # generates the Prisma client first
npm run db:deploy --workspace api   # apply pending migrations, before the new version starts
npm run start --workspace api
```

- **Database.** Supabase, with `DATABASE_URL` set as above; or, on a server of
  your own, the `postgres` service in `docker-compose.yml` running beside the
  API. The schema is identical either way — only the connection string
  differs.
- **Storage.** Lesson videos, captions and still images live in a private
  Cloudflare R2 bucket. Set `STORAGE_DRIVER=s3` and the four `STORAGE_*`
  variables, without which production refuses to start, and give the bucket
  a CORS rule for the web app's origin, `WEBAPP_URL`: run
  `npm run storage:setup --workspace api` with an admin token, again whenever
  the web app's address changes, or set it in the R2 dashboard. Without it,
  uploads fail and no video plays. The steps are in
  [`docs/guides/local-dev.md`](docs/guides/local-dev.md#file-storage).
- **Environment.** `NODE_ENV=production` turns Swagger off. Set `WEBAPP_URL`
  to the web app's public `https://` address — it is what links in emails
  point to, and production refuses anything else — and `MAIL_DRIVER=smtp`
  with the `SMTP_*` settings: production refuses the `log` driver, which would
  print invitation and reset links to the logs.
- **HTTPS.** Serve the API over HTTPS, since the web app sends session tokens
  to it across the internet. If a reverse proxy fronts it, have the proxy
  append to the `X-Forwarded-For` header the web app sends rather than
  replace it: nginx's `$proxy_add_x_forwarded_for` appends, while Caddy
  replaces it by default. The web app puts the visitor's address first, and
  sign-in throttling counts failures against that address. Replaced, every
  visitor would share the budget of the web app's own few addresses.
- **Health check.** Point the host's check at `GET /health/ready`. It answers
  503 while the database is unreachable, so traffic stops going to an instance
  that cannot serve it.
