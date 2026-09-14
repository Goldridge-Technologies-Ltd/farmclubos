# FARMCLUB OS Website

Official public website for FARMCLUB OS, part of the FARMCLUB OS monorepo (see
the root `README.md`).

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS with the shared `@farmclub/design-system` theme
- ESLint
- Turbopack for local development
- Import alias: `@/*`

## Getting Started

Install dependencies from the repository root:

```bash
npm install
```

Start the local development server from the root:

```bash
npm run dev:site
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Checks

From the repository root:

```bash
npm run lint --workspace site
npm run type-check --workspace site
npm run build --workspace site
```

## Project Notes

- The design system is documented in `docs/design-system.md` (shared) and
  `docs/site/design-patterns.md` (website), and rendered at `/design-system`.
- Tokens, fonts, brand assets and core components come from
  `packages/design-system`.
- Official brand assets are copied into `public/brand` by `npm run dev` and
  `npm run build`; that folder is gitignored.
- Website photography lives in `public/images`.
- Reference screenshots live in `docs/references` and are for visual direction
  only. They must not be used as website images or backgrounds.
- The first release is static-first and does not include authentication, a CMS,
  Supabase, or a database.
