# FARMCLUB OS Design System

The rules every FARMCLUB OS screen follows, in the public website (`site/`) and the web app (`webapp/`). It is written for the people and AI agents who build them, and the root `CLAUDE.md` loads it into every Claude Code session. Website-only layouts, components and section patterns are in `docs/site/design-patterns.md`.

**Read this before any UI work.** When you add or change a token, type role or shared component, update `packages/design-system/`, this file and `site/app/design-system/page.tsx` in the same change.

## 1. Sources of truth

In order of precedence:

1. **`packages/design-system/styles/theme.css`**: tokens (`@theme static`), element defaults and type roles (`@utility type-*`). Every app imports it (§14).
2. **`packages/design-system/components/`**: the shared components, imported as `@farmclub/design-system/<Name>`. Props and JSDoc live in the source.
3. **This document**: when and how to use them. `docs/site/design-patterns.md` adds the website's page anatomy, components and section patterns.
4. **`/design-system`** on the site (`site/app/design-system/page.tsx`): the live visual reference. Run `npm run dev:site` and open it.
5. **`docs/references/*.png`**: page mockups. They guide composition and hierarchy only, and they show content no app may publish (§13).

**Not canonical:** the "FARMCLUB OS UI Specification Manual v1.0" sheets, and any Figma file. The sheets disagree with the shipped site and with each other. Only their status colours, named type roles, motion scale and form states were adopted; everything else was rejected:

| In the sheets | Canonical (shipped) |
|---|---|
| Primary 900 `#0A3D2E`, 700 `#136F4A`/`#126B4F`, 500 `#22A063`/`#1FA463` | Green 950–50 (§3.1) |
| Accent gold `#F2B705`, accent light `#FFD05C` | Gold 600/500/400 (§3.1) |
| Success `#16A34A`, info `#0284C7`, warning `#F59E0B`, error `#DC2626` | On-brand status tokens (§3.4) |
| Poppins for all text | Poppins headings, Inter body (§4) |
| Radii 4 / 8 / 16 / pill | 8 / 12 / 18 / 20 / full (§6) |
| Neutral black shadows | Green-tinted shadows (§6) |
| Heading scale 48/36/28/22/18 | Type roles (§4.1) |
| 10K+ / 5K+ / 100+ / 1M+ counters, named hubs, partner strips | Forbidden (§13) |

## 2. Principles

- **Green leads, gold accents.** Deep green carries headings, dark bands and primary actions. Gold marks eyebrows, focus, and the single emphasised action on a dark band.
- **Photography sets the scene.** Marketing heroes lead with a real photograph; the sections below stay calm.
- **One idea per section:** eyebrow, heading, short lead, then content.
- **Borders before shadows.** Surfaces are flat with hairline borders. Shadows are for hover, open and floating states.
- **Restrained motion:** small nudges and fades, never decoration.
- **Accessible by default:** semantic HTML, visible focus, AA contrast.
- **Credible:** no invented numbers, partners or locations.

## 3. Colour

Only brand tokens compile. Tailwind's default palette is switched off, so `bg-blue-500` or `text-red-700` produce nothing. Never put hex values in `className`.

### 3.1 Brand tokens

| Class suffix | Value | Use |
|---|---|---|
| `farm-green-950` | `#052a19` | Headings on light, CTA band, dark panels, footer, overlay hero base |
| `farm-green-900` | `#06331f` | Capability bands, homepage closing band (`FinalCta`) |
| `farm-green-800` | `#0a4a2d` | Primary button, text links, icon strokes |
| `farm-green-700` | `#0b6a3e` | `IconDisc` green, bullet ticks, card labels, required markers, input focus border |
| `farm-green-600` | `#178452` | Rare accent; avoid in new work |
| `farm-green-100` | `#e4ede6` | Success surface |
| `farm-green-50` | `#ecf1e9` | Pale discs, step discs |
| `farm-gold-600` | `#cd8e19` | Eyebrows on light (see §3.5) |
| `farm-gold-500` | `#ddae39` | Gold button, outline-gold border, outer focus ring |
| `farm-gold-400` | `#edbb59` | Eyebrows, icons and links on dark |
| `farm-cream-100` | `#f4f5f1` | Alternate section background (rare), disabled fields |
| `farm-cream-50` | `#f9f9f7` | Panels and cream bands |
| `farm-charcoal` | `#14231c` | Body text (the default) |
| `farm-muted` | `#5d6b64` | Supporting text |
| `farm-border` | `#e2e8e3` | Hairlines, card borders |
| `farm-border-strong` | `#cfdad2` | Inputs, secondary button, card hover |
| `white`, `black` | `#fff`, `#000` | |

### 3.2 Roles

| Role | On light surfaces | On deep green |
|---|---|---|
| Section background | `bg-white`, `bg-farm-cream-50` | `bg-farm-green-950` (CTA, panels, footer), `bg-farm-green-900` (capability bands, homepage closing band) |
| Heading | `text-farm-green-950` | `text-white` |
| Body | `text-farm-charcoal` (default), `text-farm-muted` for supporting copy | `text-white/72` |
| Eyebrow | `<SectionLabel>` | `<SectionLabel tone="dark">` |
| Icon | `text-farm-green-800` | `text-farm-gold-400` |
| Hairline | `border-farm-border` | `border-white/12` |
| Link | `text-farm-green-800 hover:text-farm-green-950` | `text-farm-gold-400 hover:text-farm-gold-500` |
| Focus | Global two-tone `:focus-visible` ring: green-950 inner, gold-500 outer. Never remove it. | Same |

### 3.3 White on dark

`text-white` for headings, `/85` for hero leads and pills, `/72` for body copy, `/62` for captions, `/55` for fine print. `border-white/12` for dividers, `border-white/20` for pill borders, `bg-white/10` for hover fills.

Other steps in the site code (`/45`, `/54`, `/58`, `/64`, `/68`, `/70`, `/82`) are legacy; don't copy them.

### 3.4 Status

| Token | Value | Use |
|---|---|---|
| `farm-danger` | red 700 | Error text, invalid field border |
| `farm-danger-strong` | red 800 | Error banner text |
| `farm-danger-border`, `farm-danger-surface` | red 300, red 50 | Error banner |
| `farm-success`, `farm-success-surface` | green-700, green-100 | Success notice |
| `farm-info`, `farm-info-border`, `farm-info-surface` | green-950, border, cream-50 | Neutral notice |
| `farm-warning`, `farm-warning-surface` | `#7a4f08`, `#fbf3e2` (from the gold ramp) | Warning badge, and a warning notice when a screen needs one |

### 3.5 Contrast

| Pair | Ratio (approx.) | Result |
|---|---|---|
| charcoal or green-950 on white | 15:1 | Pass |
| muted on white / on cream-50 | 5.6 / 5.3 | Pass |
| white on green-800 (primary button) | 10.3 | Pass |
| green-950 on gold-500 (gold button) | 7.5 | Pass |
| gold-400 on green-950 | 8.8 | Pass |
| white/55 on green-950 | 5.6 | Pass |
| green-700 card label or required marker on white | 6.7 | Pass |
| Badge text on its fill (every tone, including warning on warning-surface at 6.5) | 5.1 or higher | Pass |
| Focus ring: green-950 inner on white / gold-500 outer on green-950 | 15.5 / 7.5 | Pass (gold-500 alone on white is 2.1, which is why the ring is two-tone) |
| **gold-600 text on white** | **2.8** | **Fails.** Only for short uppercase eyebrows (`SectionLabel`), never labels or sentences. |
| **white icon on gold-600 disc** | **2.8** | **Fails 3:1.** Prefer the green, pale or outline disc tones. |

## 4. Typography

**Fonts** are defined with `next/font` in `packages/design-system/fonts.ts`; each app's root layout puts its `fontVariables` on `<html>`.
- **Poppins** 500/600/700 for h1–h4. Base styles give headings weight 600, `-0.015em` letter spacing and balanced wrapping. Other weights fall back to the nearest loaded face.
- **Inter** for everything else, at 16px / 1.65.

### 4.1 Roles

| Utility | Size (base → sm → lg) / line height | Typical element | Used by |
|---|---|---|---|
| `type-display` | 2.15 → 3 → 3.75rem / 1.06 | h1 | Homepage hero |
| `type-h1` | 2.1 → 2.75 → 3.25rem / 1.08 | h1 | `PageHero` |
| `type-h2` | 1.75 → 2.1 → 2.4rem / 1.18 | h2 | `SectionIntro` |
| `type-h2-panel` | 1.6 → 1.9rem / 1.25 | h2 | Headings inside split bands and panels |
| `type-h2-band` | 1.5 → 1.8rem / 1.375 | h2 | `CtaBand`, compact bands |
| `type-title` | 1.35rem / 1.65 | h2, h3 | Form and aside panel titles |
| `type-eyebrow` | 0.75rem · 700 · uppercase · 0.16em | p | `SectionLabel` only |
| `type-overline` | 0.75rem · 700 · uppercase · 0.14em | p, h3 | Card labels, footer column titles |
| `type-lead` | 1rem / 1.75rem | p | Hero descriptions |
| `type-intro` | 0.975 → 1rem / 1.75rem | p | `SectionIntro` description |
| `type-body` | 0.95rem / 1.75rem | p | Section paragraphs |
| `type-body-sm` | 0.875rem / 1.75rem | p | Card, panel, FAQ and CTA copy |
| `type-caption` | 0.75rem / 1.25rem | p | Icon-row descriptions, notes |

Small UI text doesn't need a role; use plain Tailwind sizes:
- **Card title:** `text-lg` (h3)
- **Icon-row title:** `text-base` (h3)
- **List title or label:** `text-sm font-semibold`
- **List item or contact row:** `text-sm leading-6`
- **Form label:** `text-xs font-semibold`

### 4.2 Rules

- **A role stands alone.** Never add `text-[…]`, `leading-*` or `tracking-*` beside a role. A different size means a new role (§15).
- **Structure picks the element; the role picks the look.** Exactly one `h1` per page, and no skipped heading levels.
- **Eyebrows always use `SectionLabel`.** Never hand-write the uppercase style.
- **Keep lines readable:** `max-w-xl` for hero copy, `max-w-2xl` for left-aligned intros, `max-w-3xl` for centred intros.
- Older website pages still carry pre-role sizes; they are listed in `docs/site/design-patterns.md` §6. Don't copy them.

## 5. Layout

### 5.1 Breakpoints

Mobile-first, using Tailwind's default breakpoints:
- **`sm` (640px):** two-column grids and larger type steps.
- **`lg` (1024px):** the main layout switch. Multi-column rows, split heroes and dividers appear here.
- **`md` and `xl`:** avoid in new work.

Check every screen at 375, 768, 1024 and 1440.

### 5.2 Page layout belongs to each app

Containers, section rhythm and page anatomy differ between a marketing site and an application, so they are not shared:
- **Website:** `docs/site/design-patterns.md` §1–2 (`.site-container`, `.section-padding`, `PageHero` → sections → `CtaBand`).
- **Web app:** `docs/webapp/design-patterns.md` §6 — the app shell (sidebar, top bar, drawer), `.app-container` and page anatomy. If the site ever needs one of its pieces, move it into the package and document it here.

### 5.3 Spacing inside a section or panel

| Between | Class |
|---|---|
| Eyebrow → heading | `mt-3` |
| Heading → lead | `mt-4` (sections), `mt-5` (heroes) |
| Lead → list | `mt-7` |
| Copy → actions | `mt-8` with lg buttons, `mt-7` with md |
| Intro → grid | `mt-11` |
| Grid of cards | `gap-5` |
| Button group | `flex flex-wrap gap-3` (`gap-3.5` in heroes) |
| Card padding | `p-6 sm:p-7`; panels `p-7 sm:p-9` |

## 6. Shape and elevation

| Radius | Use |
|---|---|
| `rounded-button` 8px | Buttons, inputs, notices |
| `rounded-card` 12px | Cards, FAQ items, images inside panels |
| `rounded-panel` 18px | Panels, framed icon rows, standalone media |
| `rounded-band` 20px | Full-width bands: CTA, cream split bands, dark capability bands |
| `rounded-full` | Icon discs, pills |

| Shadow | Use |
|---|---|
| None + `border-farm-border` | Default surface |
| `shadow-card` | Hover, open FAQ items, a framed icon row |
| `shadow-raised` | Menus and drawers |
| `shadow-float` | A card floating over photography |
| `shadow-halo` | The white ring of `IconDisc halo` |

Tailwind's default radius, shadow, easing and animation scales are switched off, so `rounded-lg`, `shadow-md` or `ease-out` generate nothing. Arbitrary values such as `rounded-[…]` still compile; don't use them.

## 7. Motion

- **Easing:** `ease-farm` (`cubic-bezier(0.22, 0.61, 0.36, 1)`) is the default curve for every `transition-*` utility, so no easing class is needed.
- **Durations:**
  - 150ms: colour changes on links and small controls (`transition-colors`)
  - 200ms: button colour changes (`transition-colors duration-200`, built into `button-classes.ts`), transforms and surfaces (`duration-200`)
  - 500ms: image zoom (`duration-500`)
  - 620ms: hero entrance (`animate-rise`)
  - 1600ms: skeleton pulse (`animate-shimmer`), on `Skeleton` only
- **Allowed effects:**
  - arrow nudge `group-hover:translate-x-1`
  - card image `group-hover:scale-[1.04]`
  - FAQ icon `group-open:rotate-45`
  - `animate-rise` on hero copy only
  - `animate-shimmer` on loading placeholders only. Tailwind's `animate-*` scale is off, so `animate-pulse` compiles to nothing
- **Pressed:** buttons repeat their hover colours on `active:` (built into `button-classes.ts`), because Tailwind only applies `hover:` on devices that can hover.
- **Reduced motion** is handled globally in `theme.css`.
- **Not allowed:** animation libraries, scroll-triggered effects, autoplaying carousels.

## 8. Icons

- **Source:** only `packages/design-system/components/Icon.tsx`, which holds hand-drawn inline SVGs on a 24px grid (1.6 stroke, round caps and joins, `currentColor`). Never add an icon library or paste SVG into a page.
- **Colour** comes from the parent's text class.
- **Accessibility:** icons are decorative (`aria-hidden`) by default. Pass `title` when an icon carries meaning on its own.
- **Sizes:**
  - 12: connectors
  - 16: text links
  - 18: buttons
  - 20: bullet ticks
  - 19–23: inline list icons
  - 20 / 24 / 30: inside `IconDisc` sm / md / lg
  - 25–26: in 56px outline discs
  - 34–36: icon-row glyphs
- **Adding an icon:**
  1. Add the name to `iconNames` (the `IconName` type derives from it).
  2. Add its paths to `strokePaths` (or `filledPaths` for brand marks) on the same 24px grid.
  3. Check it on the site's `/design-system`, which renders `iconNames` automatically.
- **Available names:** the `iconNames` array in `Icon.tsx`, rendered on `/design-system`.

`IconDisc` tones:

| Tone | Surface | Look |
|---|---|---|
| `green` (default) | Light | Green-700 fill, white icon |
| `pale` | Light | Green-50 fill, green-900 icon |
| `outline` | Light or cream | White fill, strong border, green-800 icon |
| `gold` | Light, sparingly | Gold-600 fill, white icon; fails 3:1, avoid in new work |
| `dark` | Deep green | Faint white fill, gold-400 icon and border |

Dark bands also use a bare outline disc: `inline-flex h-14 w-14 items-center justify-center rounded-full border border-farm-gold-400/40 text-farm-gold-400`, with a 25–26px icon.

## 9. Imagery and logo

- **Photos** live in each app's `public/images/<page>/`. Never use `docs/references` images in an app.
- **Always use `next/image`,** with `fill` inside a sized parent and a `sizes` hint that matches the grid.
  - Preload only the above-the-fold hero image, with `preload`. `priority` is deprecated in Next 16.
  - This Next.js version differs from older docs, so check `node_modules/next/dist/docs/` before using an unfamiliar API.
- **Aspect ratios:** `aspect-[16/9]` for mobile hero images, `aspect-[3/2]` for card photos, `aspect-[4/3]` for photos inside split bands. Keep a source's native ratio when the image contains UI or text.
- **Alt text** describes the scene in one sentence. Purely decorative images get `alt=""`.
- **Brand files** live only in `packages/design-system/brand/`. Each app's `predev` and `prebuild` scripts copy them to its `public/brand/` (gitignored), so `/brand/…` URLs work in every app. Edit the originals, never the copies.
- **Logo:** always `@farmclub/design-system/Logo`.
  - `primary` on white and light surfaces.
  - `reversed` on deep green.
  - `symbol` / `symbolReversed` for compact marks.
  - Never redraw, recolour, add effects, or put the dark logo on dark or the white logo on white.

## 10. Shared components

Everything in `packages/design-system/components/`, imported by subpath (there is no barrel file):

```tsx
import { Button } from "@farmclub/design-system/Button";
```

The source files document the props. This section says when to use each component. Website-only components (`PageHero`, `SectionIntro`, `FeatureCard`, `CtaBand` and others) are in `docs/site/design-patterns.md` §3.

**`ButtonLink`**: every link styled as a button or arrow link.
- **Variants:**
  - `primary`: the main action on light surfaces and photos
  - `secondary`: the second action on light
  - `gold`: the main action on dark bands
  - `outline-light`: the second action on dark
  - `outline-gold`: the second action over photography
  - `text` / `text-gold`: inline arrow links on light / dark
- **Sizes:** `lg` in heroes, CTA bands and section-level actions; `md` in panels, cards and dense app screens.
- **Icon:** `arrow-right` (default), `play` for video, or `none`.
- **Don't:** use more than two actions in a group, or place two primaries side by side. `ButtonLink` is for links only; actions use `Button`.

| Component | Use for | Don't |
|---|---|---|
| `Button` | Actions such as form submits: a real `<button>` (`type="button"` unless set) sharing `ButtonLink`'s recipes. Variants `primary`, `secondary`, `gold`, `outline-light`; sizes md/lg; `disabled`, and `busy` (stays focusable, ignores activation) | Navigation (use `ButtonLink`); disabling a submit just because fields are invalid |
| `Badge` | Short static labels: categories, topics, steps, simple availability ("Coming soon"). Size `sm` (default) or `md`; tones `green`, `neutral`, `gold`, `success`, `warning`, `danger` and `info` on light, `dark` on deep green; optional `dot`; `as="li"` inside a list | Links or buttons; claims ("Verified", "Premium") or figures; colour as the only signal |
| `Icon` | Every glyph (§8) | Icon libraries, inline SVG |
| `IconDisc` | Circular icons in cards, rows, contact lists (§8) | Mix tones within one row |
| `SectionLabel` | Every eyebrow: `gold` (default) on light, `dark` on deep green, `light` for green text | Hand-styled uppercase text |
| `Logo` | The brand mark (§9) | Images of the logo |
| `Field` | Every form field: label, optional hint, control and error, with the ids wired (§11). The control is a render function receiving `{ id, describedBy, invalid }` | Wiring `aria-describedby` by hand; wrapping a checkbox, whose label surrounds its control |
| `PasswordInput` | Every password field, inside `Field`: `fieldClass` plus a show/hide button (`eye` / `eye-off`). Pass `showLabel` and `hideLabel` from the app's copy, naming the field when a form has two ("Show new password"). Spellcheck stays off, and submitting masks it again | A bare `type="password"` input; a visible "Show" text link beside the label instead |
| `Notice` | The four status treatments (§11) as `tone="info" \| "busy" \| "success" \| "error"`, with an optional `title` | Adding a `role`: a form's own `role="status"` region wraps it |
| `Skeleton` | Loading placeholders, `variant="text" \| "block"`. Always `aria-hidden` | A spinner; announcing each bar separately |
| `ProgressBar` | Progress through a pathway, module or cohort. Shows the figure as text beside the bar (§12) | Any figure that is not real platform data (§13) |
| `EmptyState` | A list, dashboard or deferred feature with nothing to show: `IconDisc`, title, copy and one optional action. The title is a `p` beneath the page's heading; `titleAs` makes it a heading when the empty state is the page, such as `h1` on a not-found screen | A bare blank panel; more than one action |
| `button-classes` | The button recipes behind `Button` and `ButtonLink`, for the rare control that can't use either | Restyling a button inline |
| `form-classes` | `fieldClass` for inputs, selects and textareas (§11) | Hand-written field styles |

**Where a new component goes:**
- Used by one app only: that app's `components/`, documented in that app's patterns doc.
- Needed by more than one app, or a generic primitive (inputs, dialogs, tables, tabs): `packages/design-system/components/`, documented here.
- Start app-only and move it into the package when a second app needs it. Never copy it.

## 11. Forms and states

Every form says plainly what happens on submit. The website is static-first and sends nothing yet (`docs/site/design-patterns.md` §5). Web app forms submit for real, so they need the busy, error and success states below.

- **Field anatomy:** use `<Field>`. It renders the label (`text-xs font-semibold text-farm-green-950`), the required marker (`<span aria-hidden="true" className="text-farm-green-700"> *</span>`), an optional hint, the control, and the error — which sits *outside* the label, so a screen reader announces it once. It hands the control `{ id, describedBy, invalid }`, so no call site wires `aria-describedby` itself. A checkbox is the exception: its label wraps its control, so it keeps its own markup. Forms say "Fields marked * are required." (copy lives with the app's content).
- **Required fields** carry the native `required` attribute. Forms keep `noValidate` and validate on submit.
- **Controls** use `fieldClass` from `@farmclub/design-system/form-classes`. Focus, invalid and disabled states are built in. Password fields use `PasswordInput`, which wraps it. Textareas add `min-h-36 py-3 leading-6`; checkboxes use `accent-farm-green-800`.
- **Submit buttons** use `<Button type="submit">`, with `busy` while work is in progress; the submit handler also returns early while busy, because Enter in a field still submits.
- **Status messages** use `<Notice>` inside one always-mounted `<div role="status">`; swap its content instead of mounting new live regions. `Notice` sets no role of its own for that reason. Field errors keep `role="alert"`, which `Field` adds.

| State | Treatment |
|---|---|
| Default | `border-farm-border-strong`, placeholder `text-farm-muted` |
| Focus | Border `farm-green-700` plus the global two-tone ring. Never add `focus:outline-none` |
| Invalid | `aria-invalid` turns the border `farm-danger`; `aria-describedby` points at an error `<span role="alert" className="text-sm font-semibold text-farm-danger">` |
| Error banner | `<Notice tone="error">`, inside the status region |
| Neutral notice | `<Notice tone="info">` |
| Disabled | `disabled`: cream-100 fill, muted text, not-allowed cursor |
| Busy | `<Button busy>`: stays focusable with `aria-disabled` and `aria-busy`, ignores activation, wait cursor; plus `<Notice tone="busy">` |
| Success | `<Notice tone="success">`, inside the status region |

## 12. Accessibility checklist

- **Landmarks:** each app's root layout provides the skip link, and every page has exactly one `main#main-content` for it to reach. The site's root layout provides that too, with `header` and `footer`; in the web app each route group's layout does, so a page rendered inside one never adds another. Give a section with no visible heading an `aria-label`.
- **Headings:** one `h1` per page, and no skipped levels.
- **Focus:** never remove the global two-tone `:focus-visible` ring.
- **Contrast:** text needs 4.5:1, large text and icons 3:1. Check §3.5 before using gold.
- **Touch targets:** at least 48px (`min-h-12` buttons and inputs).
- **Images and icons:** every image has meaningful `alt` or `alt=""`. Icons stay `aria-hidden` unless they have a title.
- **Visual-only layouts:** give them a text equivalent (see the `sr-only` list in the site's `EcosystemDiagram`). `ProgressBar` does this by printing the percentage beside the bar, not only filling it.
- **Client components** manage focus themselves (see the site's `MobileNavigation`).

## 13. Content guardrails

`AGENTS.md` and `docs/content-rules.md` are binding in every app. For UI work, that means none of the following:
- stat counters or impact figures (use capability statements instead)
- partner or supporter logo strips
- named or proposed hub locations (the Experience & Innovation Hub stays generic)
- roadmaps, projections or financial claims

In the web app, figures may appear only when they come from real platform data; never seed, mock or illustrate figures that could be read as real.

Copy is never hardcoded in JSX. The site keeps it in `site/content/pages/*.ts`; the web app will keep its copy in typed content files the same way.

## 14. Using the design system in an app

Every Next.js app in the monorepo sets up the same way:

1. **Dependency.** Add `"@farmclub/design-system": "0.1.0"` to the app's `package.json`, keep Next.js, React, Tailwind CSS and TypeScript on the versions the other apps use, add the app to the root `workspaces`, and run `npm install` from the root.
2. **Styles.** The app's `app/globals.css` starts with, in this order:
   ```css
   @import "tailwindcss";
   @import "@farmclub/design-system/theme.css";
   ```
   App-only CSS goes below, sparingly.
3. **Fonts and landmarks.** The root layout imports `fontVariables` from `@farmclub/design-system/fonts` and puts it on `<html>`, then renders the skip link and `main#main-content`. When route groups frame their content differently, as the web app's do, each group's layout provides the `main` instead.
4. **Brand files.** `"predev"` and `"prebuild"` run `node ../packages/design-system/scripts/sync-brand.mjs`.

Rules for code inside `packages/design-system/`:
- **Relative imports only.** `@/…` resolves to whichever app is compiling, so it breaks in the package.
- **No app code:** never import an app's `content/`, `lib/` or components. Type props locally.
- **No build step.** Turbopack compiles workspace packages from source. A new file needs an entry in the package's `exports` map before apps can import it.
- **Tailwind scanning.** `theme.css` carries `@source "../components"`, because Tailwind skips `node_modules`. Class names in a new folder outside `components/` need another `@source`.
- **Next.js only.** `ButtonLink`, `Logo` and `fonts.ts` use `next/link`, `next/image` and `next/font`.

## 15. Changing the system

- **New token:** add it to `@theme static` in `theme.css` and to §3, §6 or §7 here, then add a swatch or sample on `/design-system`.
- **New type role:** add an `@utility type-*` in `theme.css` and a row in §4.1, then add a specimen on `/design-system`.
- **New shared component:** build it in `packages/design-system/components/`, add it to the package's `exports`, document it in §10, then add a live example on `/design-system`.
- **Website-only component or pattern:** see `docs/site/design-patterns.md` §7.
- **Length:** keep this file under about 450 lines; it loads into every Claude session.

## 16. Known debt (don't copy)

- Gold-600 text and gold discs fail contrast (§3.5).
- White-opacity steps outside the ladder in the site code (§3.3).
- The hero scrim colour `rgb(4 32 20)` in the site stylesheet is not a token.
- The live reference exists only in the site; the web app has no equivalent yet (`docs/webapp/design-patterns.md` §7).
- There is no Figma mirror yet. When one is made, generate its tokens from `theme.css` rather than copying values by hand.
- Website-specific debt is listed in `docs/site/design-patterns.md` §8.
