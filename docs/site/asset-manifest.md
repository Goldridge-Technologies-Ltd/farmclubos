
# FARMCLUB OS Asset Manifest

Every asset the website serves from `site/public`, what it is for and where it is used.

Paths and dimensions below are the files as they exist on disk. When you add,
replace or remove an asset, update this file in the same change.

---

## Conventions

Photographs are stored as `.webp`. Diagrams and infographics that carry text
are stored as `.jpg` or `.png` so their labels stay crisp. Brand marks are
`.svg`.

All page images live under `/images/<page>/` and are rendered through
`next/image`, which re-encodes to WebP or AVIF per request — so the format on
disk affects repository size, not what visitors download.

Images must not carry embedded text, logos or location signage unless the asset
is itself an infographic.

---

## Brand Assets

The brand files live in `packages/design-system/brand/`, shared by every app.
`npm run dev` and `npm run build` copy them to `site/public/brand/`
(gitignored), so they are served at the `/brand/…` paths below. Edit the
originals, never the copies.

### /brand/primary-logo-horizontal.svg

Purpose: Main navigation and footer logo.
Background use: White or light surfaces.
Used in: `components/ui/Logo.tsx`.

### /brand/reversed-logo-horizontal-white.svg

Purpose: Dark-green footer and dark call-to-action sections.
Used in: `components/ui/Logo.tsx`.

### /brand/symbol-mark.svg

Purpose: Standalone symbol on light surfaces.
Used in: `components/ui/Logo.tsx`.

### /brand/symbol-mark-white.svg

Purpose: Standalone symbol on dark surfaces.
Used in: `components/ui/Logo.tsx`, `components/home/EcosystemDiagram.tsx`
(centre of the homepage ecosystem diagram).

### /brand/favicon.svg

Purpose: Browser favicon.
Used in: `app/layout.tsx` — `icon` and `shortcut`.

### /brand/app-icon.svg

Purpose: Apple touch icon.
Used in: `app/layout.tsx` — `apple`.

### /brand/social-avatar.svg

Purpose: Open Graph and social share avatar.
Used in: `app/layout.tsx` — `openGraph.images`.

The absolute logo URL in the organisation JSON-LD (`app/page.tsx`) points at
`https://farmclub-os.com/brand/primary-logo-horizontal.svg`, which resolves to
the same file in production.

---

## Design References

The files in `docs/references` are visual references only. They sit outside
every app, so they are never served.

They must not be rendered directly in the website.
They must not be used as page backgrounds.
They should guide layout, hierarchy, spacing and visual direction.

`01_homepage-reference.png`, `02_about-reference.png`,
`03_platform-reference.png`, `04_knowledge_centre-reference.png`,
`05_hubs-reference.png`, `06_contact-reference.png`,
`07_investors-reference.png`, `08_brand_assets_overview.png`.

---

## Homepage Images

### /images/home/home-hero-agritech-greenhouse.png

1672x941.
Purpose: Homepage hero.
Preferred crop: Wide landscape.
Text-safe area: Left side.
Subject placement: Right side.
Used in: `content/pages/home.ts` — `hero.image`.

### /images/home/experience-innovation-hub.jpg

1672x941 (16:9). Companion crop: `experience-innovation-hub-mobile.jpg`
(1254x941, 4:3, supplied but currently unused — the 16:9 original is used at
all breakpoints in the section's fixed `aspect-[4/3.1]` card).
Purpose: "Experience & Innovation Hubs" section on the homepage. A clean
editorial photograph of learners and an instructor around hydroponic and
aquaponic growing systems, with no on-image text or metrics.
Used in: `content/pages/home.ts` — `hubs.image`.

---

## About Images

### /images/about/about-header.jpg

724x320.
Purpose: About-page hero.
Shows a young agri-entrepreneur reviewing production data on a tablet in a
managed-space greenhouse.
Text-safe area: Left side. Focal point is set with `object-[62%_center]`.
Used in: `content/pages/about.ts` — `hero.image`.

### /images/about/about-tech.jpg

732x277.
Purpose: "A technology company with a purpose" section.
Shows an agri-entrepreneur working with the FARMCLUB OS dashboard.
Wide panorama; its frame in `app/about/page.tsx` uses the natural
`aspect-[732/277]` so the interface is not centre-cropped. Replacing this asset
with a different ratio means updating that class.
Used in: `content/pages/about.ts` — `caseForChange.image`.

### /images/about/about-hero-purpose-collaboration.png

1672x941.
Status: Unused. This was the About hero before `about-header.jpg` replaced it.
Retained as a fallback; safe to delete.

---

## Platform Images

### /images/platform/platform-hero-digital-operations.png

1672x941.
Purpose: Platform-page hero.
Shows a tablet or digital dashboard in an agricultural environment.
Used in: `content/pages/platform.ts` — `hero.image`.

### /images/platform/platform-ecosystem.jpg

722x517.
Status: Unused. This raster infographic used to be the whole visual for the
"Platform modules" section. It was replaced by `PlatformModulesDiagram`
(`components/platform/PlatformModulesDiagram.tsx`), a responsive SVG/HTML
radial diagram built from `content/pages/platform.ts` —
`architecture.modules`, which is live content again rather than a reference
copy. Safe to delete once confirmed nothing else needs it.

### /images/platform/who-we-serve/serve-1.webp … serve-6.webp

1536x1024 each (3:2). 66-158KB each.
Purpose: The six "Who We Serve" audience cards. Each is rendered as a
full-bleed band above the card copy at `aspect-[3/2]`, which matches the source
ratio so no face is cropped. Replacements should also be 3:2 with the subject
clear of the edges.
Used in: `content/pages/platform.ts` — `useCases.items[].image`.

| File | Card |
| --- | --- |
| serve-1.webp | Aspiring Entrepreneurs — student in a classroom |
| serve-2.webp | Growing Businesses — woman entrepreneur with greenhouse produce |
| serve-3.webp | Innovators & Researchers — producer among greenhouse crops |
| serve-4.webp | Market Actors — operator with a tablet in a packing warehouse |
| serve-5.webp | Community & Network Groups — professional in a shared workspace |
| serve-6.webp | Partners & Institutions — two partners in a meeting |

---

## Hubs Images

### /images/hubs/hubs-hero-authentic.jpg

1500x844 (16:9). Companion crop: `hubs-hero-authentic-mobile.jpg` (830x1038,
supplied but currently unused — the 16:9 original already matches both the
`PageHero` split-hero desktop column and its `aspect-[16/9]` mobile block).
Purpose: Authentic photograph of participants in a FARMCLUB OS greenhouse,
replacing the generated greenhouse artwork for the Hubs-page hero.
Used in: `content/pages/hubs.ts` — `hero.image`.

### /images/hubs/hubs-offer-authentic.jpg

1280x960 (4:3, matching the "What we offer" panel's `aspect-[4/3]` exactly).
A complementary crop of the same authentic FARMCLUB environment as
`hubs-hero-authentic.jpg`, differentiated by aspect ratio and framing so the
two do not read as duplicate images on the page.
Purpose: "A Hub Designed for Transformation" visual.
Used in: `content/pages/hubs.ts` — `offer.image`.

### /images/hubs/hubs-hero-innovation-greenhouse.png

1672x941.
Purpose: Generic Experience and Innovation Hub imagery.
No location names or signs.
Used in: `content/pages/platform.ts` — `physicalBridge.image` (the "Hub
bridge" band on the Platform page). Previously also used for the Hubs-page
hero/offer images and the homepage Hub section; those three were moved to
authentic photography — see `hubs-hero-authentic.jpg`,
`hubs-offer-authentic.jpg` and `experience-innovation-hub.jpg`.

---

## Knowledge Centre Images

### /images/knowledge/knowledge-centre-hero-learning-lab.png

1672x941.
Purpose: Knowledge Centre hero.
Shows agricultural learning, research or digital content creation.
Used in: `content/pages/knowledge.ts` — `hero.image`.

---

## Investor Images

### /images/investors/investors-hero-institutional-agritech.png

1672x941.
Purpose: Investors-page hero.
Communicates scale, innovation and agricultural opportunity.
Used in: `content/pages/investors.ts` — `hero.image`.

---

## Contact Images

### /images/contact/contact-hero-partnership-meeting.png

1672x941.
Purpose: Contact-page hero.
Shows a professional and approachable support or engagement team.
Used in: `content/pages/contact.ts` — `hero.image`.

---

## Known follow-ups

- `about-header.jpg` (724x320) and `platform-ecosystem.jpg` (722x517) are small
  for the sizes they render at, so they look soft on high-density displays.
  Re-generating them at roughly double the dimensions would fix this;
  upscaling the existing files would not.
- The six page heroes are PNGs at about 2MB each, 12.6MB in total.
  Converting them to WebP would remove most of that from the repository without
  changing what visitors download, since `next/image` already re-encodes them.
- `about-hero-purpose-collaboration.png` is unused and can be deleted.
