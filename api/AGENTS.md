# FARMCLUB OS API Instructions

The monorepo rules in `../AGENTS.md` always apply; this file adds the API's.
Paths below are relative to `api/` unless they start with `docs/` or
`packages/`, which are at the repository root.

## Project

`api/` is the FARMCLUB OS backend API: a NestJS 12 project on the Express
adapter, serving `webapp/`. It runs on port 4000; start it from the repository
root with `npm run dev:api`.

## ESM

NestJS 12 ships ESM only, so `api/` is an ESM package (`"type": "module"`).
Three consequences that are easy to trip over:

- **Relative imports carry an explicit `.js` extension** — `./health.service.js`,
  even though the file on disk is `.ts`. `nodenext` resolution requires it.
- **A type-only import must use `import type`.** Each file is transpiled in
  isolation, so a plain `import { SomeType }` becomes a real runtime import and
  fails at load. The `consistent-type-imports` lint rule catches this.
- **Jest needs `NODE_OPTIONS=--experimental-vm-modules`** (already in the npm
  scripts) on Node 22, and `jest` is not a global in ESM — import it from
  `@jest/globals` in any spec that uses `jest.fn()` or `jest.spyOn()`.

`tsconfig.json` sets `types: ["node", "jest"]` explicitly, because
`node_modules` is hoisted to the repository root and the default would make
every other workspace's `@types` ambient in the API.

## Design

The API has no app UI, so `docs/design-system.md` applies only to what the API
renders for users, such as email templates in `src/lib/mail/`: use its colour
tokens, type roles and tone there.

## Database

Prisma 7 with PostgreSQL. `prisma/schema.prisma` holds no connection details:
the CLI reads its URL from `prisma.config.ts`, and the application passes its
own to the `@prisma/adapter-pg` driver adapter in `src/lib/database/`. So one
schema serves a local Postgres and Supabase alike, and only environment
variables differ.

- **Every tenant-scoped query filters on the institution from the access
  token.** Never look a row up by id alone. An ownership check belongs in the
  service (`findFirst({ where: { id, institutionId } })`), and a miss throws
  `NotFoundException`, not `ForbiddenException`, so an id is never confirmed to
  someone who should not see it.
- **`AssessmentOption.isCorrect` never appears in a DTO** that a learner can
  reach. Grading happens in the service.
- **Progress belongs to an enrolment, never to a user.** The same person can
  take the same pathway with two institutions, and those are two records.
  `ProgressService` and `AssessmentsService` both resolve the enrolment from
  the caller, their active institution and the pathway — so a lesson,
  assessment or attempt id is only ever usable by the person it belongs to,
  and "you are not enrolled" answers 404 rather than 403.
- **`progressPercent` is recomputed from rows, never incremented.** An
  increment drifts the moment a lesson is published or a module archived, and
  a progress bar that quietly lies is worse than none.
- **A written answer is left out of an assessment's score, not marked wrong.**
  No machine can grade it; counting it as wrong would cap an otherwise perfect
  attempt and fail the learner for it. The attempt reports how many are
  waiting for a person instead.
- **Taking someone out keeps the record.** Nothing in the admin lifecycle
  deletes a row:
  - *Removing a member* sets the membership to `LEFT` and, in the same
    transaction, withdraws their open enrolments there (`INVITED`, `ACTIVE`);
    a `COMPLETED` one records work done and is left alone. A fresh invitation
    reactivates the membership.
  - *Withdrawing* sets an enrolment to `WITHDRAWN` with `withdrawnAt`, and its
    progress stays. Enrolling the same person again reactivates that
    enrolment rather than creating one, so the progress resumes.
  - *Closing a cohort* sets it to `COMPLETED`: nobody new can be enrolled, and
    every enrolment on it is untouched, so learners can finish. Reopening sets
    it back to `OPEN`.
  - *Editing a cohort* never changes its pathway, which every enrolment's
    progress hangs off.
- **Repeating a lifecycle action is done, not an error, and is not a second
  event.** Withdrawing someone already withdrawn keeps the original date;
  closing a closed cohort, removing someone already gone, or saving an edit
  that changes nothing writes and records nothing. An edit records only the
  fields that actually changed.
- **The Academy catalogue is the exception to tenancy, not to access control.**
  A pathway belongs to no institution, so `AcademyService` filters on
  publication rather than `institutionId`: `{ status: "PUBLISHED",
  archivedAt: null }`, applied at *every* level. A module is reached through
  its pathway and a lesson through its module, so an unpublished parent hides
  everything beneath it and a slug pair cannot be mixed between pathways.
- **A new table needs row-level security.** Supabase serves `public` over HTTPS
  through PostgREST, so a table created without RLS is readable by anyone with
  the project's anon key. Follow the pattern in the
  `enable_row_level_security` migration: enable RLS, add no policy, and revoke
  from `anon` and `authenticated`. The API connects as the owner, which
  bypasses RLS, so it is unaffected.
- `src/generated/prisma` is generated and gitignored. `type-check` and
  `prebuild` run `prisma generate` first, so a fresh clone works.
- Columns that would read as real platform figures if seeded —
  `Pathway.estimatedHours`, `Lesson.durationMinutes`, `Cohort.capacity`,
  `ExperienceSite.capacity`, `ReportSnapshot.payload` — stay null in every
  seed, and no `Institution` or `ExperienceSite` is ever seeded.

## Authentication and authorisation

- **Secure by default.** `JwtAuthGuard` is global: every route needs a valid
  bearer access token unless it is marked `@Public()`. Forgetting the decorator
  fails closed.
- **Roles are coarse; records are checked in the service.**
  `@PlatformRoles()` and `@InstitutionRoles()` are checked by the global
  `RolesGuard`. `@InstitutionRoles()` only knows the *active* institution in the
  token, so a route naming an institution in its path checks access to that
  institution in the service.
- **Access tokens can be up to `ACCESS_TOKEN_TTL_SECONDS` stale.** They are
  verified without a database lookup. When a change must take effect at once —
  a suspended membership, a deactivated account — check the database.
- **Any route acting inside an institution checks access through
  `InstitutionAccessService`** (`assertCanView`, `assertCanManage`), exported
  by `InstitutionsModule`. It reads memberships from the database, so a
  suspension takes effect at once, and it answers 404 to a non-member and 403
  to a member who lacks the role.
- **Every learner-side lookup checks the membership as well**, through
  `ownEnrolment()` (`src/common/auth/own-enrolment.ts`): the enrolment is the
  caller's, in their active institution, the institution is active, and their
  membership in it is still ACTIVE. Without that last part, someone removed
  from an institution could carry on learning in it until their access token
  ran out. Use it for any new query that finds "the caller's" enrolment.
- **An institution always keeps one active administrator.** Removing the last
  is refused with 409 `LAST_ADMINISTRATOR`; anyone else can be removed, the
  caller included.
- Read the caller with `@CurrentUser()` and the session details with
  `@ClientInfo()`. Never read `request.user` or headers directly.
- Refresh, invite and password-reset tokens are opaque and only ever stored as
  a SHA-256 hash (`TokenService.hashToken`). Never store, log or return a raw
  token.
- **Credential endpoints are throttled through `RateLimitService`**
  (`src/lib/rate-limit/`), which counts failures in the database rather than
  requests in memory — `@nestjs/throttler` would reset on restart and count
  each instance separately. Key on the **account**, not the address: behind the
  BFF every request arrives from the web app's own address. `assertNotBlocked`
  runs *before* the expensive work, `recordAttempt` charges a failure, and
  `clear` forgets the tally on success.
- Document every route with `@ApiEnvelope()` and `@ApiErrors()` from
  `src/common/decorators/api-envelope.decorator.ts`, so Swagger shows the real
  `{ success, message, data, meta }` shape.

## Domain and planning

- Model the database around the business domain — the real entities and how
  they relate — not around individual screens.
- Shape responses for the webapp in DTOs, not in the Prisma schema.
- Before building a feature, agree what it does. The schema and endpoints must
  cover every field and flow in that plan, and the webapp screens are built
  from the same plan.

## Testing

Jest and Supertest ship with NestJS; keep them and add no other runner.

- Write the failing spec first for services, guards, pipes, interceptors and
  anything else carrying business rules — red, green, refactor.
- Controllers, DTOs and module wiring need their `*.spec.ts` filled in within
  the same change.
- Keep every generated `*.spec.ts` beside its source file. Never delete one to
  make a build pass; fix or rewrite it.
- Unit-test a service with its dependencies replaced through the testing
  module's provider overrides, not against a real database.
- Cover each endpoint's contract — status, envelope and error cases — with a
  Supertest end-to-end spec in `test/`.
- `npm run test --workspace api` must pass before a feature is done.

## Code standards

- Never instantiate services directly (no `new PrismaClient()`, no
  `new SomeService()`) — always use constructor injection.
- Every infrastructure integration gets its own module and service:
  - `src/lib/database/prisma.module.ts` + `prisma.service.ts`
  - `src/lib/mail/mail.module.ts` + `mail.service.ts`
  - `src/lib/rate-limit/rate-limit.module.ts` + `rate-limit.service.ts`
- Mark infrastructure modules `@Global()`, export their service, and import
  each module once in `AppModule`.
- Feature modules go in `src/modules/<name>/`. Feature modules are not
  `@Global()`; import them where they are needed and export only what other
  modules use.
- Shared guards, interceptors, pipes, filters and decorators go in
  `src/common/`.
- Keep controllers thin: they handle routing and DTOs only; business logic
  lives in services.
- Validate every request body, query and param with a DTO (`class-validator`
  and `class-transformer`) and the global `ValidationPipe`.
- Read configuration through `ConfigService`, never `process.env` inside
  feature code.
- Throw Nest's built-in HTTP exceptions (`NotFoundException`,
  `BadRequestException`, …) rather than returning error objects.
- Generate files with the Nest CLI from `api/`, pointing at the feature
  folder: `nest g module modules/<name>`, `nest g service modules/<name>`,
  `nest g controller modules/<name>` (or `nest g resource modules/<name>` for
  a full CRUD feature).
- Controllers return plain data. A `ResponseTransformInterceptor` in
  `src/common/interceptors/` wraps every success into
  `{ success, message, data, meta }`, and an exception filter in
  `src/common/filters/` wraps failures into `{ success, error, meta }`. Set a
  route's message with `@CustomMessage()`; without it the message is
  "Success". Never build the envelope by hand in a controller or service.
- Return a `PaginatedResult` from a list that can outgrow one page: the
  interceptor lifts its totals into `meta.pagination`, which the web app reads
  with `apiPage`.
- Document every endpoint with `@ApiOperation`, `@ApiEnvelope()` and
  `@ApiErrors()` (see "Authentication and authorisation" above); the Swagger
  UI depends on them.
- If you change a response shape or endpoint that `webapp/` consumes, update
  the webapp side in the same change.
