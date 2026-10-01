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

### A refused submission keeps what was typed

React resets every uncontrolled field when a form's action finishes — **even
when the action failed**. Left alone, a wrong password wipes the email too,
and one bad field empties a whole form. So:

- The action hands back what was submitted with `keepValues(state, formData,
  [names])` on every failure. List only what is safe to put back into the
  page: **never a password**.
- Each field reads it back as `defaultValue={state.values?.name}`. React resets
  to the default, so the reset restores what was typed.
- A `<select>` also needs `key={state.values?.name ?? ""}`. React applies a
  select's `defaultValue` only when it mounts, so without a remount the reset
  falls back to the placeholder.

A success returns no `values`, so the form clears, ready for the next entry.

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
| `AppSidebar` | The permanent sidebar, `lg` and up. Deep green, gold active marker, and a group per role below the main links — *Manage*, *Content*, *Platform* — passed in by `AppShell` |
| `AppMobileNav` | The same sections as a drawer below `lg` |
| `AppTopBar` | Drawer trigger and logo on small screens, active institution on large, account menu |
| `UserMenu` | The account disclosure: who you are, the institutions to switch between, profile, sign out |
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
`src/lib/api/` — `academy.ts`, `authoring.ts`, `institution.ts`,
`platform.ts` — whose functions turn "there is nothing here" into
`notFound()` and let everything else throw. The API being down is not the same
as a page not existing, and must not look like it.

**A read behind a role checks the role itself**, as `authoring.ts` does with
`assertContentTeam`, and not only in the section's layout. A page renders
alongside its layout, so with the check in the layout alone the page's own
request still reaches the API for someone the layout is turning away, and
fails there. (`platform.ts` still relies on its layout; move it over when it
is next touched.)

For a record read by an id from the URL, "nothing here" includes a 400: the
API's uuid check refuses a malformed id before looking, and retrying will not
help. `isMissingRecord` covers both. Use it only for reads by id — a 400
anywhere else is a real validation failure.

A list that can outgrow one page uses `apiPage`, which keeps the totals that
`apiRequest` drops, so the screen can say "showing 100 of 240" rather than
silently stopping at the first page.

Nothing in the Academy is cached, deliberately. The catalogue is identical for
everyone so caching it would be safe in principle, but the client refuses to
cache any reply that carried a bearer token, and an exception to that rule is
how one person's data eventually reaches another.

### Mutations

Every write is a Server Action in `src/lib/actions/`, because each needs the
access token from an httpOnly cookie the browser cannot read. A control that
writes is therefore a `<form action={…}>`, never an `onClick` — that is why
"Mark as complete", a lesson's "Continue" and "Start the assessment" are forms
with a hidden input.

After a write, `revalidatePath` clears the router's client-side cache for the
segments that show the same data. These reads are per-user and so uncached on
the server, but the router still holds segments already visited: without it,
going back to a module would show a lesson you just completed as outstanding.

A control that would fail is not shown. The completion button and the
assessment launcher appear only for someone enrolled on that pathway;
everyone else is told why, which is more use than a button that 404s. The
same goes for the lifecycle below: no *Remove* for an institution's only
administrator, and no *Enrol again* on a closed intake or for someone who has
left the institution. Each says why in a line instead.

### Asking before acting

An action that takes something away — removing a member, withdrawing a
learner, closing an intake — asks first, with `ConfirmAction`
(`src/components/ui/`). **In place, not in a modal:** the button is replaced
by what will happen and two buttons, *go ahead* and *Cancel*, so the question
sits beside the thing it concerns and there is no focus trap to get wrong.

- **Focus** moves to *go ahead*, which carries the consequence as its
  `aria-describedby`, so a screen reader reads the question with the button.
  *Cancel* or Escape puts the original button back and focuses it.
- **The consequence** says what goes with it, in real counts ("2 open cohort
  places will be withdrawn"), and what is kept ("progress is kept"). It names
  the person rather than using a pronoun, which the platform does not know.
- **A row of the same buttons** is told apart by a `target`, read after the
  label but not shown: "Remove, Ada Obi".
- **Open, it takes the whole row** — `col-span-full w-full` — so the sentence
  is never squeezed into the column the button sat in.

`ActionButton` is the same without the question, for a one-press action that
takes nothing away: reopening an intake, enrolling someone again.

**The result is reported to the page, not beside the button.** The row a
control sat in usually leaves the list it was in, taking any message with it
and dropping focus to the top of the document. So a page that uses either —
or `InviteActions`, whose *Revoke* takes an invitation off the waiting list —
wraps itself in `ActionOutcome`, puts one `ActionOutcomeMessage` under its
header, and a success is shown there and takes focus (as `FocusOnMount`
does). A refusal stays with the control, which is still on the page, and so
does a result whose row stays, such as *Resend*'s.

`useReportedAction` makes the report once the action answers, inside
`startTransition`. After an `await`, an update is no longer part of the
action's transition unless wrapped again; unwrapped, the message arrived
about 400ms ahead of the refreshed page it describes, and a closed intake
briefly showed its Close button again.

### Autosave

The assessment form saves a second after answering stops, never on every
keystroke, and a failed background save is not surfaced as an error — the
answers are still in the form and submitting will send them. Shouting about it
would be alarming and useless.

### Running an institution

The screens under `/institution` — Members and Cohorts — are for whoever can
manage the active institution: an `INSTITUTION_ADMIN`, or a platform admin
working inside one. `canManageInstitution` in `src/lib/navigation.ts` decides
whether the *Manage* group appears; `/institution/layout.tsx` repeats the check
with `managedInstitution()` and answers not-found to anyone else, as the API
would.

**The institution always comes from the session, never from the URL or the
form.** There is no institution id in these routes and none in their hidden
fields, so there is nothing to edit that reaches another institution. The API
checks access on every request regardless.

The order of work is fixed by the data: a person must *accept an invitation*
before they are a member, and must be a member before they can be *enrolled*.
The enrol form therefore offers a list of members rather than a free email
field — it cannot be filled in wrongly.

The rest of an intake's life happens on the same two screens:

- **Members** — *Remove* beside each member, asking first. Their open cohort
  places go with them; their progress stays, and a new invitation brings them
  back. Removing yourself goes home afterwards, since these screens are no
  longer yours.
- **A cohort** — *Withdraw* beside each learner still working through it.
  Withdrawn learners are listed apart, with the date and their progress, and
  *Enrol again* resumes it. *Close the intake* at the foot stops new
  enrolments; a closed intake says so at the top with *Reopen*, and hides the
  enrol form. *Edit details* is its own screen, with every field but the
  pathway, which is shown and explained.
- **The cohort list** puts closed intakes under their own heading, and a
  closed intake's badge reads *Closed* — "Completed" would read as every
  learner finishing.
- **A learner on a closed intake** is told on their dashboard and on My
  Journey that it has closed to new learners and they can still finish,
  unless they already have.

### Switching institution

Someone in more than one institution sees them in the account menu, the
current one marked with `aria-current`, and picks one there: the choice
belongs to the account, not to any screen. The list also appears when no
institution is active but one is available, as after removing yourself.

The Server Action posts to `/api/auth/switch-institution` and replaces **only
the access-token cookie** (`writeAccessTokenCookie`). The refresh token is
untouched, and the API records the choice on the session, so the next
refresh stays in it. It then goes home — the page they were on may belong to
the institution they just left — and the menu, open "for this route and
institution", closes itself as the institution changes.

### Running the platform

`/platform/institutions` is where a platform administrator adds an
institution and invites the person who will run it; that person takes it from
there on `/institution`. `canAdministerPlatform` decides whether the *Platform*
group appears, and it needs no active institution: someone who belongs to none
is exactly who sets the first one up. `/platform/layout.tsx` answers not-found
to anyone else.

Here the institution **does** come from the URL — choosing among every
institution is the whole job — which is the one difference from the
`/institution` screens. It grants nothing: the API confirms the platform role
against the database on every request.

The sidebar and drawer take their role groups as data (`NavGroup[]`) from
`AppShell`, which decides them on the server. A new role-specific section is a
new group there, not a new flag threaded through three components.

### Building the Academy

The screens under `/content/academy` are where the platform's content team,
`PLATFORM_ADMIN` and `CONTENT_MANAGER`, builds the Academy that every
institution's learners take. `canAuthorContent` decides whether the *Content*
group appears; like *Platform*, it needs no active institution.

- **Each level is a screen, addressed by id:** a pathway lists its modules, a
  module its lessons, a lesson its scenes, and each scene has its own editor.
  Ids rather than slugs, because a draft's slug follows its title.
- **Order is set with Move up and Move down**, never drag-and-drop alone,
  which a keyboard or switch user cannot do. `MoveButtons` puts focus back on
  the pressed button once the row arrives in its new place, so a keyboard
  user can keep moving it.
- **Publishing says what learners will see.** A draft is hidden. A lesson
  publishes only with at least one scene, every one complete, and a refusal
  names the scenes still missing something. Unpublishing and archiving ask
  first (`ConfirmAction`) and say that progress is kept; archived items are
  listed apart and restore as drafts.
- **Each scene says what it still needs** ("Needs the video and a still
  image"), from the `gaps` the API reports rather than worked out on screen.
  Captions are optional, so never among them; their slot's hint says so.

### Uploading files

A video scene takes an MP4 and a still image, and WebVTT captions if the
content team has them. `MediaUpload` sends each **straight from the browser to storage**, never
through the web app: to the bucket, or with the API's local storage driver
to its storage route, which stands in for one. The screen cannot tell which:

1. `requestUpload`, a Server Action, asks the API for a signed PUT for this
   file's exact type and size. Both are checked first in the browser, from
   `src/lib/media.ts`, for a quick answer; the API has the final say.
2. The browser PUTs the file with `XMLHttpRequest`, since `fetch` reports no
   upload progress, and a `ProgressBar` shows how far it has got. The bar sits
   outside the `role="status"` region, so each percent is not read out.
3. `completeUpload` has the API check what arrived. Only then does the file
   replace the old one, and the screen say so.

The file picker is the browser's own, restyled only through `file:`, so it
keeps its keyboard behaviour and its announcement. It takes the slot's full
width on a phone, where its natural width is wider than the space, and file
names wrap anywhere, having no spaces to wrap at.

### Writing notes

Notes, and a video's supporting lines, are written in a small syntax: `##` for
a heading, `**bold**`, `_italic_`, `-` or `1.` for lists, and
`[words](https://…)` for a link, with toolbar buttons that insert it and a
*Preview*. `src/lib/notes.ts` reads it into a tree of text, emphasis, lists
and links that `NotesView` renders with the design system's type. **It never
produces HTML**, so nothing typed can become markup, and a link can only go to
a web or email address. Headings start at `h3`: on the lesson page the lesson
is the `h1` and each scene an `h2`.

### The lesson player

A lesson plays one scene at a time, a video or notes, with the scenes listed
beside it in `SceneOutline`: ticks for those finished, and
`aria-current="step"` on this one.

- **The address names the scene**, counted from 1: `?scene=2`. Without one, an
  enrolled learner resumes at the first scene they have not finished
  (`sceneToShow`), and anyone else starts at the beginning.
- **Continue records the scene and moves on.** For an enrolled learner it is
  a form posting to a Server Action, which redirects to the next scene, or to
  `?completed=1` after the last. Back, and Continue for someone not enrolled,
  are plain links: there is nothing to record.
- **Progress counts scenes, never time watched.** Nothing tracks the video.
- **A video plays with its captions on**, when it has them, and its
  transcript in a `<details>` beneath. Without captions it has neither. The
  `<video>` carries `crossOrigin="anonymous"`: captions come from storage, on
  another origin, and a browser drops a cross-origin track without it. `preload="none"` and the still image spare a slow connection a
  video nobody has started.
- **The end panel shows only to someone who has finished**, or who is not
  enrolled and has nothing to finish. It leads on to the next lesson, or back
  to the module.
- **A lesson with no scenes yet** says it is being written, and keeps *Mark
  as complete*.

**Focus follows the learner between scenes.** A move swaps the scene and
leaves focus on a button whose meaning just changed, so `SceneHeading` moves
it to the new scene's title. The signal is the address naming a scene, not a
memory of the scene before, because **a Server Action's redirect remounts the
page**: anything a component kept in a ref is gone after Continue.

### When content replaces what someone was using

Submitting a quiz turns the page into its result. Wrap content like that in
`FocusOnMount` (`src/components/ui/`): focus brings it into view wherever the
page was scrolled, and tells a screen reader something new is there instead of
leaving them on a button that no longer exists. Only do it on the arrival that
caused the change — the attempt page does it only with `?submitted=1`, which
the submit action adds — or every visit would pull focus past the heading.
A lesson's end does the same with `?completed=1`.

Neither `FocusOnMount` nor `SceneHeading` takes focus on a page loaded afresh,
by a reload or a bookmark, where nothing was replaced. `useHydrating`
(`src/hooks/`) tells a fresh load, which React hydrates, from a move within
the app, which it renders in the browser.

`html { scroll-padding-top }` in `src/app/globals.css` keeps anything scrolled
into view, the skip link's target included, clear of the sticky top bar.

### Dates

Format with `formatDay` from `src/lib/format.ts`, which always works in UTC. A
cohort's dates are plain days; parsed in a local timezone they move back a day
for anyone west of Greenwich.

## 7. Not defined yet

These arrive with the screens that need them, and are documented here in the
same change:

- The institution dashboard: reporting on learners and progress across
  cohorts, a later milestone
- Tables and pagination controls: lists are one page today, and say so when
  there is more
- A live reference page for the web app, as the site has at `/design-system`
- The rest of the lesson production script: interactive scenes such as
  questions and concept cards, the AI tutor, facilitator review and the
  Skills Passport. A new scene kind joins the same list of scenes
