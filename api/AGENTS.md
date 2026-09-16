# FARMCLUB OS API Instructions

The monorepo rules in `../AGENTS.md` always apply; this file adds the API's.
Paths below are relative to `api/` unless they start with `docs/` or
`packages/`, which are at the repository root.

## Project

`api/` is the FARMCLUB OS backend API: a NestJS 12 project on the Express
adapter, serving `webapp/`.

It is not scaffolded yet — the folder holds only its instructions. When it is
created, give it a `package.json` and add it to the root `workspaces`.

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
- If you change a response shape or endpoint that `webapp/` consumes, update
  the webapp side in the same change.
