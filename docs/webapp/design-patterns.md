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

## 6. The app shell

Everything behind a session is wrapped by `AppShell`
(`src/components/layout/`), which the `(app)` route group's layout renders
once. The session is fetched there, once, and passed down as props; no screen
fetches it again to draw chrome.

| Piece | What it does |
|---|---|
| `AppShell` | The frame: fixed sidebar from `lg`, top bar, content column. Owns `main#main-content` |
| `AppSidebar` | The permanent sidebar, `lg` and up. Deep green, gold active marker |
| `AppMobileNav` | The same sections as a drawer below `lg` |
| `AppTopBar` | Drawer trigger and logo on small screens, active institution on large, account menu |
| `UserMenu` | The account disclosure: who you are, profile, sign out |
| `PageHeader` | Crumbs, eyebrow, the page's only `h1`, description, actions |
| `Breadcrumbs` | The trail for nested screens. Crumbs are passed in, never derived from the URL |
| `Panel` | The basic content surface: flat white, hairline border |
| `AppErrorState` | What an `error.tsx` segment renders |

Three decisions in there are worth not undoing:

- **`main#main-content` belongs to the route group, not the root layout.** The
  skip link has to jump past the sidebar and the bar to reach the content,
  which it cannot do if one `main` wraps them all. `(auth)` provides its own.
- **The user menu is a disclosure, not a `role="menu"`.** Menu semantics
  promise arrow-key roving over `menuitem`s, and a `menuitem` may not be a
  form — but signing out must be a form posting to a Server Action, because
  only an action may clear an httpOnly cookie.
- **The drawer's open state is "open for this route", not a boolean.** A route
  change then closes it during render, with no effect synchronising the two.
  This is the site's `MobileNavigation` behaviour, which has been through it.

### Page anatomy

```tsx
<div className="app-stack">
  <PageHeader eyebrow="…" heading="…" description="…" />
  <Panel title="…">…</Panel>
</div>
```

`.app-container` (in `src/app/globals.css`) sets the content measure and
gutters; `AppShell` applies it, so a screen never does. `.app-stack` is the
vertical rhythm between the blocks of a screen. The website's
`.site-container` and `.section-padding` are **not** available here.

A page heading uses `type-h2-band`, not `type-h1`: the `h1` roles are sized
for a marketing hero and would shout on a screen sitting beside a sidebar.

### Navigation

`src/lib/navigation.ts` is the single source: `appNavigation` drives the
sidebar and the drawer, `accountNavigation` drives the user menu, and
`isActiveNavItem` decides what is highlighted. Home matches exactly — as a
prefix, `/` would light up everywhere — and every other item matches its own
path and anything below it, but only at a `/` boundary.

### Sections that are not open yet

Two components, for two different situations:

- **`CapabilityScreenView`** — Experience, Mentorship and Enterprise. Phase 1
  sections whose tables exist and whose screens do not. Each says what it is
  for, then shows the empty state it will genuinely have on day one.
- **`FutureCapabilityPanel`** — Marketplace and Finance. Not being built yet,
  and the page says what has to be true first. This is the sanctioned use of
  `Badge tone="warning"` with "Coming soon"; §4 still applies, so no date, no
  ordering, no figure and no partner name appears.

### A missing record is a soft 404

`notFound()` renders the right page but the response has already begun
streaming as a `200`, so the status cannot change — Next documents this and
injects `noindex`. A real `404` would mean checking the slug before the
response streams, which for us means calling the API from `proxy.ts`, and
`proxy.ts` must never call the API. The app is `noindex` throughout, so the
trade is worth taking; don't "fix" it by moving the lookup into the proxy.

### Reading the API

Screens never call `apiRequest` directly. Each area gets one module in
`src/lib/api/` — `academy.ts` is the first — whose functions turn the API's
404 into `notFound()` and let everything else throw. The API being down is not
the same as a page not existing, and must not look like it.

Nothing in the Academy is cached, deliberately. The catalogue is identical for
everyone so caching it would be safe in principle, but the client refuses to
cache any reply that carried a bearer token, and an exception to that rule is
how one person's data eventually reaches another.

## 7. Not defined yet

These arrive with the screens that need them, and are documented here in the
same change:

- Switching between institutions when someone belongs to more than one
- Tables, list rows and pagination
- Dashboard composition, once there is real data to compose
- A live reference page for the web app, as the site has at `/design-system`
