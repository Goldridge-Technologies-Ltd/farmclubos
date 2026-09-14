# FARMCLUB OS Design System

The rules every screen on the FARMCLUB OS website follows. It is written for the people and AI agents who build pages, and `CLAUDE.md` loads it into every Claude Code session.

**Read this before any UI work.** When you add or change a token, type role, component or section pattern, update `app/globals.css`, this file and `app/design-system/page.tsx` in the same change.

## 1. Sources of truth

In order of precedence:

1. **`app/globals.css`**: tokens (`@theme static`) and type roles (`@utility type-*`).
2. **`components/`**: the shipped components. Props and JSDoc live in the source.
3. **This document**: when and how to use them.
4. **`/design-system`** (`app/design-system/page.tsx`): the live visual reference. Run the app and open it.
5. **`public/references/*.png`**: page mockups. They guide composition and hierarchy only, and they show content the site must not publish (§14).

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
| 10K+ / 5K+ / 100+ / 1M+ counters, named hubs, partner strips | Forbidden (§14) |

## 2. Principles

- **Green leads, gold accents.** Deep green carries headings, dark bands and primary actions. Gold marks eyebrows, focus, and the single emphasised action on a dark band.
- **Photography sets the scene.** Heroes lead with a real photograph; the sections below stay calm.
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

Other steps in the code (`/45`, `/54`, `/58`, `/64`, `/68`, `/70`, `/82`) are legacy; don't copy them.

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

**Fonts** are loaded with `next/font` in `app/layout.tsx`:
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

- **A role stands alone.** Never add `text-[…]`, `leading-*` or `tracking-*` beside a role. A different size means a new role (§16).
- **Structure picks the element; the role picks the look.** Exactly one `h1` per page, from the hero, and no skipped heading levels.
- **Eyebrows always use `SectionLabel`.** Never hand-write the uppercase style.
- **Keep lines readable:** `max-w-xl` for hero copy, `max-w-2xl` for left-aligned intros, `max-w-3xl` for centred intros.

### 4.3 Legacy sizes (don't copy)

These predate the roles. Leave them until their page is redesigned, then move them to the role shown.

| Where | Classes | Move to |
|---|---|---|
| `PageHero` split h1 | `text-[2.1rem] leading-[1.1] sm:text-[2.75rem] lg:text-[3.1rem]` | `type-h1` |
| About "who we are", `HubsSection` | `text-[1.8rem] leading-[1.15] sm:text-[2.15rem]` | `type-h2-panel` |
| Hubs offer, Platform hub bridge, Knowledge library | `text-[1.6–1.7rem] leading-tight sm:text-[1.95–2rem]` | `type-h2-panel` |
| Investors thesis and model | `text-[1.55rem] leading-tight sm:text-[1.85rem]` | `type-h2-panel` |
| About journey note | `text-[1.5rem] leading-snug sm:text-[1.85rem]` | `type-h2-band` |
| Contact FAQ heading | `text-[1.6rem] sm:text-[1.9rem]` | `type-h2-panel` |
| Uppercase labels at 0.08/0.1/0.12/0.18em, `tracking-wide` | | `type-overline` or `type-eyebrow` |
| `StepJourney` / `EcosystemDiagram` small text (`0.8`, `0.72`, `0.65rem`) | | `type-caption` |

## 5. Layout

### 5.1 Breakpoints

Mobile-first, using Tailwind's default breakpoints:
- **`sm` (640px):** two-column grids and larger type steps.
- **`lg` (1024px):** the main layout switch. Multi-column rows, split heroes and dividers appear here.
- **`md` and `xl`:** avoid in new work. `md` only appears inside `.site-container`.

Check every screen at 375, 768, 1024 and 1440.

### 5.2 Containers and section rhythm

- **Standard section:** `<section className="section-padding bg-…"><div className="site-container">…</div></section>`.
- **`.site-container`:** max 1200px wide, with 1.25rem gutters (2rem from 768px).
- **`.section-padding`:** `clamp(3.5rem, 6.5vw, 6rem)` top and bottom.
- **Framed bands between sections** use explicit padding instead (`bg-white pt-8`, `pt-10 pb-4 lg:pt-12`, `pb-4`). `CtaBand` brings its own `pt-6 pb-14`.
- **Anchors and focus:** the header is sticky at `h-[4.75rem]`; `html` carries `scroll-padding-top: 6rem`, so anchor jumps and keyboard focus land clear of it. Don't add `scroll-mt-*` to sections.
- **Gotcha:** `.site-container`, `.section-padding`, `.surface-card` and `.hero-scrim*` are unlayered CSS, so they beat utilities. For example, `section-padding pt-0` keeps the top padding. Never combine them with conflicting utilities; when spacing must be asymmetric, use explicit `pt-*`/`pb-*` instead of `section-padding`.

### 5.3 Spacing inside a section

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

### 5.4 Page anatomy

1. **`PageHero`.** Use `overlay` for story pages (about, platform) and `split` for utility pages (hubs, knowledge centre, investors, contact). The homepage uses `HeroSection`.
2. **Three to six sections.** Alternate `bg-white` and `bg-farm-cream-50`, with at most one deep-green band between light sections. Never place two dark bands next to each other. The section right before `CtaBand` is light.
3. **`CtaBand`.** Exactly one, closing every page.
4. **Header and footer** come from `app/layout.tsx`. Never render them in a page.

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
| `shadow-card` | Hover (`.surface-card`), open FAQ items, a framed icon row |
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
- **Allowed effects:**
  - arrow nudge `group-hover:translate-x-1`
  - card image `group-hover:scale-[1.04]`
  - FAQ icon `group-open:rotate-45`
  - `animate-rise` on hero copy only
- **Pressed:** buttons repeat their hover colours on `active:` (built into `button-classes.ts`), because Tailwind only applies `hover:` on devices that can hover.
- **Reduced motion** is handled globally in `globals.css`.
- **Not allowed:** animation libraries, scroll-triggered effects, autoplaying carousels.

## 8. Icons

- **Source:** only `components/ui/Icon.tsx`, which holds hand-drawn inline SVGs on a 24px grid (1.6 stroke, round caps and joins, `currentColor`). Never add an icon library or paste SVG into a page.
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
  3. Check it on `/design-system`, which renders `iconNames` automatically.
- **Available names:** the `iconNames` array in `components/ui/Icon.tsx`, rendered on `/design-system`.

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

- **Photos** live in `public/images/<page>/` and are referenced from the page's content file as `ImageAsset { src, alt }`. Never use `public/references` images on the site.
- **Always use `next/image`,** with `fill` inside a sized parent and a `sizes` hint that matches the grid.
  - Preload only the above-the-fold hero image, with `preload`. `priority` is deprecated in Next 16.
  - This Next.js version differs from older docs, so check `node_modules/next/dist/docs/` before using an unfamiliar API.
- **Aspect ratios:** `aspect-[16/9]` for mobile hero images, `aspect-[3/2]` for card photos, `aspect-[4/3]` for photos inside split bands. Keep a source's native ratio when the image contains UI or text.
- **Text over photos** goes only through `.hero-scrim`. Split heroes fade with `.hero-scrim-soft`. Set the focal point with `imagePosition="object-[NN%_center]"`.
- **Alt text** describes the scene in one sentence. Purely decorative images get `alt=""`.
- **Logo:** always `components/ui/Logo.tsx`.
  - `primary` on white and light surfaces.
  - `reversed` on deep green.
  - `symbol` / `symbolReversed` for compact marks.
  - Never redraw, recolour, add effects, or put the dark logo on dark or the white logo on white.

## 10. Components

The source files document the props. This section says when to use each component.

### 10.1 Primitives: `components/ui/`

**`ButtonLink`**: every link styled as a button or arrow link.
- **Variants:**
  - `primary`: the main action on light surfaces and photos
  - `secondary`: the second action on light
  - `gold`: the main action on dark bands
  - `outline-light`: the second action on dark
  - `outline-gold`: the second action over photography
  - `text` / `text-gold`: inline arrow links on light / dark
- **Sizes:** `lg` in heroes, CTA bands and section-level actions; `md` in panels and cards.
- **Icon:** `arrow-right` (default), `play` for video, or `none`.
- **Don't:** use more than two actions in a group, or place two primaries side by side. `ButtonLink` is for links only; actions use `Button`.

| Component | Use for | Don't |
|---|---|---|
| `Button` | Actions such as form submits: a real `<button>` (`type="button"` unless set) sharing `ButtonLink`'s recipes. Variants `primary`, `secondary`, `gold`, `outline-light`; sizes md/lg; `disabled`, and `busy` (stays focusable, ignores activation) | Navigation (use `ButtonLink`); disabling a submit just because fields are invalid |
| `Badge` | Short static labels: categories, topics, steps, simple availability ("Coming soon"). Size `sm` (default) or `md`; tones `green`, `neutral`, `gold`, `success`, `warning`, `danger` and `info` on light, `dark` on deep green; optional `dot`; `as="li"` inside a list | Links or buttons; claims ("Verified", "Premium") or figures; colour as the only signal |
| `Icon` | Every glyph | Icon libraries, inline SVG |
| `IconDisc` | Circular icons in cards, rows, contact lists | Mix tones within one row |
| `SectionLabel` | Every eyebrow: `gold` (default) on light, `dark` on deep green, `light` for green text | Hand-styled uppercase text |
| `SectionIntro` | Eyebrow + h2 + lead opening a section. `align="center"` above grids, `tone="dark"` on dark bands | Headings inside panels (use `SectionLabel` + `type-h2-panel`) |
| `FeatureCard` | Grid cards. `icon` (+ `align="center"`) for icon grids, `image` for photo cards, `label` for an overline, `href` for an arrow link pinned to the bottom (give every card in a grid a link, or none) | Cards with several links or buttons |
| `BulletList` | Checked lists of short benefits. `tone="dark"` on dark, `columns={2}` for 6+ items | Long sentences, nested lists |
| `StepJourney` | Numbered 4–6 step progressions. `lg` full width, `sm` beside an intro | Non-sequential content |
| `FaqList` | Question/answer lists (native `<details>`, no JS) | Content that must be visible by default |
| `PageHero` | Top of every non-home page | The homepage (`HeroSection`) |
| `CtaBand` | The closing band of every page | More than one per page |
| `LegalNotice` | Interim legal pages | Marketing content |
| `Logo` | The brand mark | Images of the logo |
| `ContactFormShell` | Contact enquiries (validated on the device, sends nothing) | Other forms: build from `form-classes.ts` (§12) |

### 10.2 Layout: `components/layout/`

`SiteHeader`, `DesktopNavigation`, `MobileNavigation`, `SiteFooter` and `NewsletterSignup` are rendered by `app/layout.tsx`; never render them in pages. Menu items come from `lib/navigation.ts`, and footer columns and contact details from `lib/site.ts`.

### 10.3 Homepage sections: `components/home/`

`HeroSection`, `CapabilityStrip`, `PlatformEcosystem` + `EcosystemDiagram`, `EntrepreneurJourney`, `HubsSection` and `FinalCta`. Each takes one slice of `homePageContent`. They are built for the homepage; generalise one into `components/ui/` before reusing it elsewhere.

`components/knowledge/KnowledgeExplorer` provides client-side search over Knowledge Centre content.

## 11. Section patterns

Start from the canonical example. Only design a new layout when none of these fit (§15, step 5).

### 11.1 Intro + card grid (`app/about/page.tsx`, "Commitment to change")

```tsx
<section className="section-padding bg-farm-cream-50">
  <div className="site-container">
    <SectionIntro eyebrow="…" heading="…" description="…" align="center" />
    <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <FeatureCard key={item.title} {...item} align="center" />
      ))}
    </div>
  </div>
</section>
```

### 11.2 Split band (`app/hubs/page.tsx`, "What we offer")

```tsx
<section className="section-padding bg-white">
  <div className="site-container">
    <div className="grid gap-9 rounded-band bg-farm-cream-50 p-6 sm:p-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
      <div>
        <SectionLabel>…</SectionLabel>
        <h2 className="mt-3 type-h2-panel text-farm-green-950">…</h2>
        <p className="mt-4 type-body text-farm-muted">…</p>
        <BulletList items={…} className="mt-7" />
        <ButtonLink href="…" size="lg" className="mt-8">…</ButtonLink>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-card">
        <Image src={…} alt={…} fill sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" />
      </div>
    </div>
  </div>
</section>
```

**Dark variant** (`app/platform/page.tsx`, hub bridge): `bg-farm-green-950 text-white`, `<SectionLabel tone="dark">`, copy in `text-white/72`, pills as `<Badge as="li" size="md" tone="dark">` in a `flex flex-wrap gap-2.5` list.

### 11.3 Divided icon row (`app/hubs/page.tsx`, capabilities)

```tsx
<ul className="grid gap-y-9 rounded-panel border border-farm-border bg-white px-6 py-10 shadow-card sm:grid-cols-2 sm:px-8 lg:grid-cols-5 lg:gap-y-0">
  {items.map((item, index) => (
    <li
      key={item.title}
      className={["px-3 text-center", index > 0 ? "lg:border-l lg:border-farm-border" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="mx-auto inline-flex text-farm-green-800">
        <Icon name={item.icon} size={36} />
      </span>
      <h3 className="mt-4 text-base text-farm-green-950">{item.title}</h3>
      <p className="mt-2 type-caption text-farm-muted">{item.description}</p>
    </li>
  ))}
</ul>
```

Variants:
- **Plain:** drop the panel classes (hubs "impact goals").
- **Dark** (platform capability band): `rounded-band bg-farm-green-900 px-6 py-11 text-white`, dividers in `lg:border-white/12`, a 56px gold outline disc, and captions in `text-white/62`.

Set `lg:grid-cols-*` to the item count. Items are `h3` under a section heading, or `h2` when the row is the whole section.

### 11.4 Framed step journey (`app/platform/page.tsx`, "How it works")

`rounded-band border border-farm-border bg-farm-cream-50 px-6 py-11 sm:px-9 lg:grid lg:grid-cols-[0.72fr_2fr] lg:items-center lg:gap-10`. It has two parts:
- an intro column: `SectionLabel`, `type-h2-panel`, `type-body-sm`, then `ButtonLink`
- `<StepJourney size="sm" className="mt-10 lg:mt-0" />`

### 11.5 Content with aside (`app/contact/page.tsx`)

`site-container grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start`. Main content goes on the left. The aside is either a `rounded-panel bg-farm-cream-50 p-6 sm:p-8` panel or a dark `rounded-panel bg-farm-green-950 p-7 text-white` panel, with a `type-title` heading.

### 11.6 FAQ (`app/contact/page.tsx`)

A heading, then `<div className="mt-7"><FaqList items={…} /></div>`, optionally beside a dark assistance panel (§11.5).

### 11.7 Closing

Every page ends with `<CtaBand … icon="…" />`. Pick an icon that fits the page.

## 12. Forms and states

The site is static-first. Forms validate on the device and must say plainly that nothing is sent until an integration exists (`docs/project-brief.md`).

- **Field anatomy:** a `<div className="grid gap-1.5">` holding a `<label className="grid gap-1.5">` (label text in `text-xs font-semibold text-farm-green-950`, required marker `<span aria-hidden="true" className="text-farm-green-700"> *</span>`, then the control), then the error. The error sits outside the label so screen readers announce it once. Checkbox labels carry the same marker, and the form says "Fields marked * are required." (copy from `content/pages`).
- **Required fields** carry the native `required` attribute. Forms keep `noValidate` and validate on submit.
- **Controls** use `fieldClass` from `components/ui/form-classes.ts`. Focus, invalid and disabled states are built in. Textareas add `min-h-36 py-3 leading-6`; checkboxes use `accent-farm-green-800`.
- **Submit buttons** use `<Button type="submit">`, with `busy` while work is in progress; the submit handler also returns early while busy, because Enter in a field still submits.
- **Status messages** render inside one always-mounted `<div role="status">`; swap its content instead of mounting new live regions. Field errors keep `role="alert"`.

| State | Treatment |
|---|---|
| Default | `border-farm-border-strong`, placeholder `text-farm-muted` |
| Focus | Border `farm-green-700` plus the global two-tone ring. Never add `focus:outline-none` |
| Invalid | `aria-invalid` turns the border `farm-danger`; `aria-describedby` points at an error `<span role="alert" className="text-sm font-semibold text-farm-danger">` |
| Error banner | `rounded-button border border-farm-danger-border bg-farm-danger-surface p-3.5 text-sm font-semibold text-farm-danger-strong`, inside the status region |
| Neutral notice | `rounded-button border border-farm-info-border bg-farm-info-surface p-3.5 text-xs leading-6 text-farm-muted` |
| Disabled | `disabled`: cream-100 fill, muted text, not-allowed cursor |
| Busy | `<Button busy>`: stays focusable with `aria-disabled` and `aria-busy`, ignores activation, wait cursor; plus a status notice |
| Success | `rounded-button border border-farm-success bg-farm-success-surface p-3.5`, inside the status region |

## 13. Accessibility checklist

- **Landmarks:** the layout provides the skip link, `header`, `main#main-content` and `footer`. Give a section with no visible heading an `aria-label`.
- **Headings:** one `h1` (the hero), and no skipped levels.
- **Focus:** never remove the global two-tone `:focus-visible` ring.
- **Contrast:** text needs 4.5:1, large text and icons 3:1. Check §3.5 before using gold.
- **Touch targets:** at least 48px (`min-h-12` buttons and inputs).
- **Images and icons:** every image has meaningful `alt` or `alt=""`. Icons stay `aria-hidden` unless they have a title.
- **Visual-only layouts:** give them a text equivalent (see the `sr-only` list in `EcosystemDiagram`).
- **Client components** manage focus themselves (see `MobileNavigation`).

## 14. Content guardrails

`AGENTS.md` and `docs/content-rules.md` are binding. For UI work, that means none of the following:
- stat counters or impact figures (use capability statements instead)
- partner or supporter logo strips
- named or proposed hub locations (the Experience & Innovation Hub stays generic)
- roadmaps, projections or financial claims

Page copy lives in `content/pages/*.ts`, never hardcoded in JSX.

## 15. New-screen recipe

1. **Brief.** Copy `docs/screens/_template.md` to `docs/screens/<route>.md` and fill it in. Every section must name a pattern (§11) or component (§10).
2. **Content.** Create `content/pages/<page>.ts`, exporting `type <Page>PageContent` and `const <page>PageContent`. Reuse `HomeAction`, `ImageAsset` and `IconItem` from `content/pages/home.ts`.
3. **Route.** Create `app/<route>/page.tsx` as a Server Component with `export const metadata: Metadata = { title, description }`. The layout appends "| FARMCLUB OS".
4. **Compose.** `PageHero` → sections from §11 → `CtaBand`, using tokens and type roles only.
5. **Fill gaps properly.** If no pattern fits, build a component in `components/ui/`, then document it in §10–11 and add it to `/design-system`. No one-off layouts in page files.
6. **Wire up.** If the page belongs in the menu, add it to `lib/navigation.ts`; `app/sitemap.ts` reads that list.
7. **Check.**
   - Run `npm run lint`, `npm run type-check` and `npm run build`.
   - View the page at 375, 768, 1024 and 1440.
   - Tab through it with the keyboard.
   - Re-read §14.

## 16. Changing the system

- **New token:** add it to `@theme static` in `globals.css` and to §3, §6 or §7 here, then add a swatch or sample on `/design-system`.
- **New type role:** add an `@utility type-*` in `globals.css` and a row in §4.1, then add a specimen on `/design-system`.
- **New component or pattern:** build it in `components/ui/`, document it in §10 or §11, then add a live example on `/design-system`.
- **Length:** keep this file under about 500 lines; it loads into every Claude session.

## 17. Known debt (don't copy)

- Legacy heading sizes and uppercase tracking values (§4.3).
- White-opacity steps outside the ladder (§3.3).
- Gold-600 text and gold discs fail contrast (§3.5).
- Touch targets under 48px: the mobile menu button (44px), the footer social links (36px), the contact-page social links (40px), the newsletter field and Subscribe button (40px), and `FaqList` summaries (about 25px tall, because the padding sits on `<details>`).
- `NewsletterSignup` removes its input's outline (`focus:outline-none`) and joins the input and button in an `overflow-hidden` wrapper that clips the button's ring; the wrapper's gold `focus-within` border is the only cue.
- The unlayered layout classes beat utilities, so `section-padding pt-0` in `app/hubs/page.tsx` and `app/knowledge-centre/page.tsx` has no effect.
- The divided icon row is hand-built in four pages (hubs, investors, knowledge centre, platform) with small differences. Extract an `IconRow` component once they are harmonised.
- `EcosystemDiagram` uses a one-off shadow, and the hero scrim colour `rgb(4 32 20)` is not a token.
- `public/references` is served publicly at `/references/…` and shows forbidden content; move it out of `public/`.
- `docs/asset-manifest.md` has drifted from the files in use.
- The site domain is `farmclub-os.com`, but the contact email uses `farmclubos.com`.
- There is no Figma mirror yet. When one is made, generate its tokens from `globals.css` rather than copying values by hand.
