# FARMCLUB OS

Official public website foundation for FARMCLUB OS. 

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Turbopack for local development
- Import alias: `@/*`

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Checks

Run linting:

```bash
npm run lint
```

Run TypeScript checking:

```bash
npm run type-check
```

Run the production build:

```bash
npm run build
```

## Project Notes

- The design system is documented in `docs/design-system.md` and rendered at `/design-system`.
- Official brand assets live in `public/brand`.
- Website photography lives in `public/images`.
- Reference screenshots live in `public/references` and are for visual direction only.
- Reference screenshots must not be used as website images or backgrounds.
- The first release is static-first and does not include authentication, a CMS, Supabase, or a database.
