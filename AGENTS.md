# FARMCLUB OS Repository Instructions

## Project

FARMCLUB OS is a digital platform for agricultural entrepreneurship,
innovation and ecosystem transformation.

Tagline:

CONNECT · EMPOWER · GROW

## Repository Layout

This is an npm-workspaces monorepo holding every FARMCLUB OS codebase.

| Path | What it is | Its instructions |
|---|---|---|
| `site/` | The official public website (Next.js, static-first) | `site/AGENTS.md` |
| `webapp/` | The authenticated FARMCLUB OS web app (Next.js) | `webapp/AGENTS.md` |
| `api/` | The backend API (NestJS; not scaffolded yet, add it to the root `workspaces` when it gets a `package.json`) | `api/AGENTS.md` |
| `packages/design-system/` | `@farmclub/design-system`: tokens, type roles, fonts, brand assets and core UI primitives shared by the apps | `docs/design-system.md` |
| `docs/` | Shared docs: design system, content rules, reference artwork | |
| `docs/site/` | Website docs: brief, page notes, asset manifest, screen briefs, section patterns | |

Read the `AGENTS.md` of the app you are changing as well as this file.

- Install once from the repository root with `npm install`. Add a dependency
  to one workspace with `npm install <package> --workspace <site|webapp>`.
- There is one lockfile, at the root. Turbopack uses it to find the
  repository root; a second lockfile inside an app breaks shared imports.
- Run an app with `npm run dev:site` (port 3000) or `npm run dev:webapp`
  (port 3001).
- Keep Next.js, React, Tailwind CSS and TypeScript on the same versions in
  every workspace, and upgrade them together.
- Keep changes scoped to the app you are working in. When a change crosses
  apps, such as an API contract that `webapp/` consumes, update both sides in
  the same change.

## Technical Direction

Use:

- Next.js App Router for `site/` and `webapp/`
- NestJS for `api/`
- TypeScript
- Tailwind CSS with the shared FARMCLUB OS theme
- React Server Components by default
- Client Components only when interactivity requires them
- Semantic HTML
- Responsive design
- Accessible components
- Typed content structures

Do not use:

- Create React App
- Bootstrap
- A second component library or styling system beside the design system
- Screenshot-based page rendering
- Monolithic page components
- Unnecessary animation libraries
- Inline styling for the primary design system
- Hardcoded repeated content

## Design System

The design system is shared by every app.

- **Foundations** (tokens, type roles, shared components, forms,
  accessibility, content guardrails): `docs/design-system.md`. Read it before
  any UI work in any app.
- **Tokens and type roles:** `packages/design-system/styles/theme.css`.
- **Shared components:** `packages/design-system/components/`, imported as
  `@farmclub/design-system/<Name>`.
- **Website layouts and section patterns:** `docs/site/design-patterns.md`.
- **Live reference:** the site's `/design-system` page
  (`site/app/design-system/page.tsx`).

Rules:

- Use only its tokens and `type-*` roles: no hex values or new arbitrary text
  sizes in class names.
- Never copy a shared component or token into an app. Change it in the
  package so every app follows.
- When adding a token, role or shared component, update the package,
  `docs/design-system.md` and `site/app/design-system/page.tsx` together.
- The external "UI Specification Manual" sheets are not canonical.

## Visual References

Review all files in:

`docs/references`

These files guide the visual design only.

Never:

- Render a complete reference screenshot inside a page
- Use a reference screenshot as a page background
- Crop sections from a reference and pretend they are coded components
- Trace or redraw the official logo from a screenshot
- Copy reference files into an app's `public/` folder

Rebuild every layout with HTML, CSS and React components.

References guide composition and hierarchy only. For colours, type, spacing
and components, the design system takes precedence.

## Official Brand Assets

The official FARMCLUB OS brand assets are located in:

`packages/design-system/brand`

That folder is the only copy to edit. Each app's `predev` and `prebuild`
scripts copy it to the app's `public/brand` (gitignored), so every app serves
the same `/brand/…` URLs. Render the logo with
`@farmclub/design-system/Logo`.

Use SVG versions for navigation, footer and scalable interface use.

Do not:

- Redraw the logo with CSS
- Trace the logo from a screenshot
- Reconstruct the logo using an icon library
- Alter the proportions of the logo
- Change the logo colours
- Add effects, gradients or shadows to the official logo
- Place the dark logo on a dark background
- Place the white logo on a white background

Use:

- Primary horizontal logo on white and light surfaces
- Reversed white logo on deep-green surfaces
- Standalone symbol for favicon, decorative marks and compact mobile contexts

## Content Restrictions

These apply to every app. Terminology and voice are in
`docs/content-rules.md`.

Do not display:

- Ikorodu Hub
- Ibadan Hub
- Enugu Hub
- Kano Hub
- Any other proposed hub location
- Location-specific hub signage
- A hub-location carousel
- A trusted-partners logo strip
- Unconfirmed partner logos
- Unverified impact statistics
- Speculative traction figures
- Confidential product roadmaps
- Unsupported financial claims

The Experience and Innovation Hub must remain a generic platform concept.

In the web app, figures may appear only when they come from real platform
data. Never seed, mock or illustrate figures in a way that could be read as
real.

## TypeScript Approach

Use TypeScript throughout the project.

Keep the typing practical and easy to maintain.

- Use simple interfaces or type aliases for page content and component props.
- Avoid unnecessary generics and complicated abstract type systems.
- Do not create types merely for the sake of creating types.
- Do not use `any` unless there is a documented technical reason.
- Use React Server Components by default.
- Keep client-side JavaScript to the minimum required.
- Keep content data typed but readable.
- Run TypeScript checking before completing substantial tasks.

## Development Quality

Before completing any substantial task, from the repository root:

- Run linting: `npm run lint`
- Run TypeScript checking: `npm run type-check`
- Run the production build: `npm run build`
- Fix errors
- Inspect responsive behaviour
- Preserve accessibility
- Avoid unnecessary dependencies

Each command covers every workspace; add `--workspace <name>` to check one.

Do not declare a task complete when the build is failing.

## Next.js

Both apps use a Next.js version with breaking changes from older releases.
Read the relevant guide in `node_modules/next/dist/docs/` (installed at the
repository root) before writing Next.js code, and heed deprecation notices.
`next dev` keeps a managed block in `site/AGENTS.md` and `webapp/AGENTS.md`;
commit it rather than removing it.
