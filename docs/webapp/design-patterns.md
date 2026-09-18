# FARMCLUB OS Web App Patterns

How screens are built in `webapp/`. `docs/design-system.md` always applies and
comes first; this file adds only what is specific to an authenticated
application, the way `docs/site/design-patterns.md` does for the website.

**The website's section patterns are marketing layouts.** Don't reach for
`PageHero`, `CtaBand` or the §4 section patterns on an app screen unless the
screen really is a marketing page.

## 1. What exists so far

The shared primitives an app screen is built from, all imported by subpath from
`@farmclub/design-system/<Name>`:

| Need | Use |
|---|---|
| A form field | `Field` + `fieldClass` |
| A status message | `Notice` |
| Waiting for data | `Skeleton` |
| How far through something | `ProgressBar` |
| A list or screen with nothing in it | `EmptyState` |
| Actions and navigation | `Button`, `ButtonLink` |
| Labels, glyphs, brand | `Badge`, `Icon`, `IconDisc`, `SectionLabel`, `Logo` |

Anything an app screen needs that is missing goes in
`packages/design-system/components/` when the site could use it too, or in
`webapp/src/components/` when it is application-only — see
`docs/design-system.md` §10, "Where a new component goes".

## 2. The four states every data screen has

A screen that loads something needs all four, not just the happy one.

- **Loading** — `loading.tsx` for the segment, built from `Skeleton` in the
  shape of the content it replaces, so the page does not jump when it arrives.
  `Skeleton` is `aria-hidden`; put the `role="status"` on the region around it
  so loading is announced once rather than once per bar.
- **Empty** — `EmptyState`, saying what would be here and what to do next. A
  learner with no cohort yet should learn that from the screen, not guess.
- **Error** — `error.tsx` for the segment. In Next.js 16 the prop is `retry`,
  not `reset`. Offer the retry as a `Button`, and say what failed in one
  sentence without exposing internals.
- **Missing** — `notFound()` for a record that does not exist, never an empty
  state pretending it does.

## 3. Forms

Website forms validate and send nothing. **App forms submit for real**, so
every one needs the busy, error and success states in
`docs/design-system.md` §11:

- `Field` for each field, which wires `aria-describedby`, `aria-invalid` and
  the required marker. A checkbox keeps its own markup, because its label
  wraps its control.
- One always-mounted `<div role="status">` per form, whose content is swapped
  for a `Notice`. Never mount a second live region.
- `<Button type="submit" busy>` while the request is in flight, and the
  submit handler returns early while busy — pressing Enter in a field still
  submits.
- Validate on the server too. The API validates every body against a DTO; the
  client check is for speed of feedback, not for safety.
- Map the API's error `code` to the field it belongs to, so a
  `CURRENT_PASSWORD_INCORRECT` lands under the password field rather than in a
  banner.

## 4. Figures

`AGENTS.md` is binding: **in the web app, figures may appear only when they
come from real platform data.** No seeded, illustrative or placeholder
numbers, counts or percentages, anywhere, including in a loading state — a
skeleton shows a shape, never a number.

`ProgressBar` takes a real value such as `Enrolment.progressPercent`, and
prints it as text beside the bar so it is not carried by width alone.

## 5. Copy

Copy is never hardcoded in JSX. The site keeps it in
`site/content/pages/*.ts`; the web app keeps it in typed content files under
`webapp/src/content/` the same way, composed from shared primitive types.
Terminology follows `docs/content-rules.md` — "learner" in the platform and
institution context, "participant" at a Hub, "Experience & Innovation Hub"
never "Experience Hub".

## 6. Not defined yet

These arrive with the screens that need them, and are documented here in the
same change:

- The app shell: sidebar, top bar, mobile drawer, user menu, breadcrumbs
- Page anatomy and the app's layout container
- Tables, list rows and pagination
- Dashboard composition
- A live reference page for the web app, as the site has at `/design-system`
