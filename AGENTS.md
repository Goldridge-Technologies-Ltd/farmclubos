# FARMCLUB OS Repository Instructions

## Project

This repository contains the official public website for FARMCLUB OS.

FARMCLUB OS is a digital platform for agricultural entrepreneurship,
innovation and ecosystem transformation.

Tagline:

CONNECT · EMPOWER · GROW

## Technical Direction

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Server Components by default
- Client Components only when interactivity requires them
- Semantic HTML
- Responsive design
- Accessible components
- Typed content structures

Do not use:

- Create React App
- Bootstrap
- Screenshot-based page rendering
- Monolithic page components
- Unnecessary animation libraries
- Inline styling for the primary design system
- Hardcoded repeated content

## Visual References

Review all files in:

`/public/references`

These files guide the visual design only.

Never:

- Render a complete reference screenshot inside a page
- Use a reference screenshot as a page background
- Crop sections from a reference and pretend they are coded components
- Trace or redraw the official logo from a screenshot

Rebuild every layout with HTML, CSS and React components.

References guide composition and hierarchy only. For colours, type, spacing
and components, the design system below takes precedence.

## Design System

The design system is documented in `docs/design-system.md` and rendered live at
`/design-system` (`app/design-system/page.tsx`). Tokens and type roles live in
`app/globals.css`.

- Read `docs/design-system.md` before any UI work.
- Build new pages from its section patterns and components, starting with a
  brief from `docs/screens/_template.md`.
- Use only its tokens and `type-*` roles: no hex values or new arbitrary text
  sizes in class names.
- When adding a token, role, component or pattern, update `app/globals.css`,
  `docs/design-system.md` and `/design-system` together.
- The external "UI Specification Manual" sheets are not canonical.

## Brand Assets

Use official logo files from:

`/public/brand`

Use website photography from:

`/public/images`

## Content Restrictions

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

## Homepage Requirements

Remove the partner and supporter section appearing below the Hub section in
the homepage reference.

Replace unsupported numerical impact claims with capability statements:

- Learning & Capacity Building
- Enterprise Development
- Innovation & Research
- Market Access
- Impact Intelligence

## Development Quality

Before completing any substantial task:

- Run linting
- Run TypeScript checking
- Run the production build
- Fix errors
- Inspect responsive behaviour
- Preserve accessibility
- Avoid unnecessary dependencies

Do not declare a task complete when the build is failing.

## Official Brand Assets

The official FARMCLUB OS brand assets are located in:

`/public/brand`

Use SVG versions for website navigation, footer and scalable interface use.

Do not:

- Redraw the logo with CSS
- Trace the logo from a screenshot
- Reconstruct the logo using an icon library
- Alter the proportions of the logo
- Change the logo colours
- Add effects, gradients or shadows to the official logo
- place the dark logo on a dark background
- place the white logo on a white background

Use:

- Primary horizontal logo on white and light surfaces
- Reversed white logo on deep-green surfaces
- Standalone symbol for favicon, decorative marks and compact mobile contexts


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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
