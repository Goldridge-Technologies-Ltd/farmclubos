# FARMCLUB OS Website Design Patterns

Website-only page anatomy, components and section patterns for `site/`. `site/CLAUDE.md` loads this file. The shared foundations in `docs/design-system.md` (tokens, type roles, shared components, forms, accessibility and content guardrails) always apply as well.

Paths are relative to `site/` unless they start with `docs/` or `packages/`.

**When you add or change a website component or section pattern,** update this file and `app/design-system/page.tsx` in the same change. A component the web app also needs moves to `packages/design-system/` and is documented in `docs/design-system.md` instead.

## 1. Page anatomy

1. **`PageHero`.** Use `overlay` for story pages (about, platform) and `split` for utility pages (hubs, knowledge centre, investors, contact). The homepage uses `HeroSection`.
2. **Three to six sections.** Alternate `bg-white` and `bg-farm-cream-50`, with at most one deep-green band between light sections. Never place two dark bands next to each other. The section right before `CtaBand` is light.
3. **`CtaBand`.** Exactly one, closing every page.
4. **Header and footer** come from `app/layout.tsx`. Never render them in a page.

## 2. Containers and section rhythm

These classes live in `app/globals.css`, not in the shared theme.

- **Standard section:** `<section className="section-padding bg-…"><div className="site-container">…</div></section>`.
- **`.site-container`:** max 1200px wide, with 1.25rem gutters (2rem from 768px).
- **`.section-padding`:** `clamp(3.5rem, 6.5vw, 6rem)` top and bottom.
- **Framed bands between sections** use explicit padding instead (`bg-white pt-8`, `pt-10 pb-4 lg:pt-12`, `pb-4`). `CtaBand` brings its own `pt-6 pb-14`.
- **Anchors and focus:** the header is sticky at `h-[4.75rem]`; `html` carries `scroll-padding-top: 6rem`, so anchor jumps and keyboard focus land clear of it. Don't add `scroll-mt-*` to sections.
- **Surfaces and heroes:** `.surface-card` (hover border and `shadow-card`), `.hero-scrim` for text over photos, `.hero-scrim-soft` for split heroes. Set the focal point with `imagePosition="object-[NN%_center]"`.
- **Gotcha:** `.site-container`, `.section-padding`, `.surface-card` and `.hero-scrim*` are unlayered CSS, so they beat utilities. For example, `section-padding pt-0` keeps the top padding. Never combine them with conflicting utilities; when spacing must be asymmetric, use explicit `pt-*`/`pb-*` instead of `section-padding`.
- **Photos** are referenced from the page's content file as `ImageAsset { src, alt }`.

## 3. Website components

The shared primitives (`Button`, `ButtonLink`, `Badge`, `Icon`, `IconDisc`, `SectionLabel`, `Logo`, `fieldClass`) are in `docs/design-system.md` §10.

### 3.1 `components/ui/`

| Component | Use for | Don't |
|---|---|---|
| `SectionIntro` | Eyebrow + h2 + lead opening a section. `align="center"` above grids, `tone="dark"` on dark bands | Headings inside panels (use `SectionLabel` + `type-h2-panel`) |
| `FeatureCard` | Grid cards. `icon` (+ `align="center"`) for icon grids, `image` for photo cards, `label` for an overline, `href` for an arrow link pinned to the bottom (give every card in a grid a link, or none) | Cards with several links or buttons |
| `BulletList` | Checked lists of short benefits. `tone="dark"` on dark, `columns={2}` for 6+ items | Long sentences, nested lists |
| `StepJourney` | Numbered 4–6 step progressions. `lg` full width, `sm` beside an intro | Non-sequential content |
| `FaqList` | Question/answer lists (native `<details>`, no JS) | Content that must be visible by default |
| `PageHero` | Top of every non-home page | The homepage (`HeroSection`) |
| `CtaBand` | The closing band of every page | More than one per page |
| `LegalNotice` | Interim legal pages | Marketing content |
| `ContactFormShell` | Contact enquiries (validated on the device, sends nothing) | Other forms: build from `form-classes` (§5) |

### 3.2 Layout: `components/layout/`

`SiteHeader`, `DesktopNavigation`, `MobileNavigation`, `SiteFooter` and `NewsletterSignup` are rendered by `app/layout.tsx`; never render them in pages. Menu items come from `lib/navigation.ts`, and footer columns and contact details from `lib/site.ts`.

### 3.3 Homepage sections: `components/home/`

`HeroSection`, `CapabilityStrip`, `PlatformEcosystem` + `EcosystemDiagram`, `EntrepreneurJourney`, `HubsSection` and `FinalCta`. Each takes one slice of `homePageContent`. They are built for the homepage; generalise one into `components/ui/` before reusing it elsewhere.

`components/knowledge/KnowledgeExplorer` provides client-side search over Knowledge Centre content.

## 4. Section patterns

Start from the canonical example. Only design a new layout when none of these fit (§7, step 5).

### 4.1 Intro + card grid (`app/about/page.tsx`, "Commitment to change")

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

### 4.2 Split band (`app/hubs/page.tsx`, "What we offer")

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

### 4.3 Divided icon row (`app/hubs/page.tsx`, capabilities)

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

### 4.4 Framed step journey (`app/platform/page.tsx`, "How it works")

`rounded-band border border-farm-border bg-farm-cream-50 px-6 py-11 sm:px-9 lg:grid lg:grid-cols-[0.72fr_2fr] lg:items-center lg:gap-10`. It has two parts:
- an intro column: `SectionLabel`, `type-h2-panel`, `type-body-sm`, then `ButtonLink`
- `<StepJourney size="sm" className="mt-10 lg:mt-0" />`

### 4.5 Content with aside (`app/contact/page.tsx`)

`site-container grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start`. Main content goes on the left. The aside is either a `rounded-panel bg-farm-cream-50 p-6 sm:p-8` panel or a dark `rounded-panel bg-farm-green-950 p-7 text-white` panel, with a `type-title` heading.

### 4.6 FAQ (`app/contact/page.tsx`)

A heading, then `<div className="mt-7"><FaqList items={…} /></div>`, optionally beside a dark assistance panel (§4.5).

### 4.7 Closing

Every page ends with `<CtaBand … icon="…" />`. Pick an icon that fits the page.

## 5. Forms on the website

The website is static-first. Forms validate on the device and must say plainly that nothing is sent until an integration exists (`docs/site/project-brief.md`). Field anatomy and states follow `docs/design-system.md` §11, and form copy (including "Fields marked * are required.") comes from `content/pages`.

## 6. Legacy type sizes (don't copy)

These predate the type roles. Leave them until their page is redesigned, then move them to the role shown.

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

## 7. New-screen recipe

1. **Brief.** Copy `docs/site/screens/_template.md` to `docs/site/screens/<route>.md` and fill it in. Every section must name a pattern (§4) or component (§3, or `docs/design-system.md` §10).
2. **Content.** Create `content/pages/<page>.ts`, exporting `type <Page>PageContent` and `const <page>PageContent`. Reuse `HomeAction`, `ImageAsset` and `IconItem` from `content/pages/home.ts`.
3. **Route.** Create `app/<route>/page.tsx` as a Server Component with `export const metadata: Metadata = { title, description }`. The layout appends "| FARMCLUB OS".
4. **Compose.** `PageHero` → sections from §4 → `CtaBand`, using tokens and type roles only.
5. **Fill gaps properly.** If no pattern fits, build a component in `components/ui/` (or in `packages/design-system/components/` if the web app needs it too), document it here or in `docs/design-system.md` §10, and add it to `/design-system`. No one-off layouts in page files.
6. **Wire up.** If the page belongs in the menu, add it to `lib/navigation.ts`; `app/sitemap.ts` reads that list.
7. **Check.**
   - Run `npm run lint`, `npm run type-check` and `npm run build` from the repository root.
   - View the page at 375, 768, 1024 and 1440.
   - Tab through it with the keyboard.
   - Re-read `docs/design-system.md` §13.

## 8. Known debt (don't copy)

- Legacy heading sizes and uppercase tracking values (§6).
- Touch targets under 48px: the mobile menu button (44px), the footer social links (36px), the contact-page social links (40px), the newsletter field and Subscribe button (40px), and `FaqList` summaries (about 25px tall, because the padding sits on `<details>`).
- `NewsletterSignup` removes its input's outline (`focus:outline-none`) and joins the input and button in an `overflow-hidden` wrapper that clips the button's ring; the wrapper's gold `focus-within` border is the only cue.
- The unlayered layout classes beat utilities, so `section-padding pt-0` in `app/hubs/page.tsx` and `app/knowledge-centre/page.tsx` has no effect.
- The divided icon row is hand-built in four pages (hubs, investors, knowledge centre, platform) with small differences. Extract an `IconRow` component once they are harmonised.
- `EcosystemDiagram` uses a one-off shadow.
- `docs/site/asset-manifest.md` has drifted from the files in use.
- The site domain is `farmclub-os.com`, but the contact email uses `farmclubos.com`.
