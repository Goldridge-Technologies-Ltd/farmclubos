# FARMCLUB OS API Instructions

The monorepo rules in `../AGENTS.md` always apply; this file adds the API's.
Paths below are relative to `api/` unless they start with `docs/` or
`packages/`, which are at the repository root.

## Project

`api/` is the FARMCLUB OS backend API: a NestJS 12 project on the Express
adapter, serving `webapp/`. It runs on port 3002; start it from the repository
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
  `src/common/interceptors/` wraps every success into `{ success, data, meta }`,
  and an exception filter in `src/common/filters/` wraps failures into
  `{ success, error }`. Never build the envelope by hand in a controller or
  service.
- Document every endpoint with `@ApiOperation` and `@ApiResponse`; the Swagger
  UI depends on them.
- If you change a response shape or endpoint that `webapp/` consumes, update
  the webapp side in the same change.
