# Contributing to FARMCLUB OS

This is an npm-workspaces monorepo: `site/` (public website), `webapp/` (web
app), `api/` (NestJS API) and `packages/design-system/` (shared UI).

Before changing an app, read its `AGENTS.md`, and `AGENTS.md` at the root for
the rules that apply everywhere.

## Branch naming

- `feat/<short-name>` — new feature
- `fix/<short-name>` — bug fix
- `chore/<short-name>` — non-functional change (deps, docs, cleanup)
- `refactor/<short-name>` — code change without behaviour change

Name the app when it makes the branch clearer: `feat/api-auth`,
`fix/webapp-login-redirect`.

## Commit messages

Conventional Commits, with the workspace as the scope and an optional module
after a slash:

```
feat(api/auth): add email and password sign-in
fix(webapp/dashboard): await searchParams before reading filters
chore(design-system): add the gold badge tone
docs(repo): document the local development setup
```

- **Types:** `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`,
  `build`, `ci`, `revert`.
- **Scopes:** `api`, `webapp`, `site`, `design-system`, `docs`, `repo` —
  optionally `scope/module`, such as `api/auth` or `webapp/onboarding`.
- The `commit-msg` hook enforces this format.

The body explains **why** rather than **what**, when the diff doesn't already
answer that.

A change that crosses apps — an API contract that `webapp/` consumes, or a
shared component used by both front ends — belongs in **one** commit, with
both sides updated.

## Local development

See [`docs/guides/local-dev.md`](docs/guides/local-dev.md) for the full
development environment setup.

## Tests

We work test-first. Jest is the test runner everywhere; do not introduce
Vitest or a second runner.

**What to test, and when to write it:**

| Workspace | Tooling | Rule |
|---|---|---|
| `api/` | Jest + Supertest (both ship with NestJS) | **Write the failing spec first** for services, guards, pipes, interceptors and anything carrying business rules. Controllers, DTOs and module wiring need their spec filled in within the same commit. |
| `webapp/` | Jest + React Testing Library | **Sparingly, and only where a test earns its place** — logic that can break silently, such as form validation, permission-dependent rendering, or data shaping in `src/lib/`. Don't test markup, styling or wiring. Most webapp changes need no test; set the tooling up when the first case appears. |
| `site/` | — | Static marketing pages; no unit tests. Check it in the browser instead. |
| `packages/design-system/` | Jest | Only once a primitive carries logic rather than styling alone. |

Keep the `*.spec.ts` files the Nest CLI generates next to their source file.
Deleting one to make a build pass is not acceptable; fix or rewrite it.

A feature is not done until its tests pass and cover the behaviour agreed in
its plan.

**Commands**, all from the repository root:

```bash
npm test                          # every workspace that defines tests
npm run test --workspace api      # one workspace
npm run lint                      # every workspace
npm run type-check                # every workspace
npm run build                     # every workspace
```

## Pull requests

- One logical change per PR.
- All tests pass, and pre-commit hooks are not bypassed — never commit with
  `--no-verify`.
- The description says what changed and why, references any related issue,
  includes a test plan, and calls out anything reviewers should look at
  closely.
- Code review is required from one engineer before merge.
- Keep the managed `next dev` block in `site/AGENTS.md` and
  `webapp/AGENTS.md`; commit it rather than stripping it.

## Project conventions

- **Instruction files.** Each app has an `AGENTS.md` (durable project rules,
  read by every agent and developer) and a `CLAUDE.md` (Claude Code tooling,
  which imports the `AGENTS.md`). When a convention changes, update both so
  they don't drift.
- **Design system.** All UI follows `docs/design-system.md`. Import shared
  components from `@farmclub/design-system/<Name>`; never copy a component or
  redefine a token inside an app.
- **API response envelope.** Every successful controller response is wrapped
  by a `ResponseTransformInterceptor` into `{ success, data, meta }`, and
  failures by an exception filter into `{ success, error }`. Both live in
  `api/src/common/`. Controllers return plain data and never build the
  envelope themselves; `webapp/` unwraps it in one place,
  `src/lib/api/client.ts`.
- **Swagger documentation.** Every endpoint carries `@ApiOperation` and
  `@ApiResponse` decorators; the Swagger UI depends on them.
- **Content guardrails.** The content restrictions in `AGENTS.md` are binding:
  no invented statistics, partners or hub locations.
- **Environment variables.** Never commit a `.env` file. Document each new
  variable in `docs/guides/local-dev.md`.
