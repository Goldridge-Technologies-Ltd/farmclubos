# Screen brief: <Page name>

> Copy this file to `docs/site/screens/<route>.md` and fill it in before writing code, then keep it up to date. Every section must name a pattern (`docs/site/design-patterns.md` §4) or a component (§3 there, or `docs/design-system.md` §10). Paths are relative to `site/`.

## Summary

- **Route:** `/<route>`
- **Purpose:** <one sentence: what this page must achieve>
- **Audience:** <who it is for>
- **Primary action:** <label → href>
- **Navigation:** <main menu position / footer only / unlinked>
- **Content file:** `content/pages/<page>.ts`

## Sections

| # | Section | Pattern or component | Surface | Content keys |
|---|---|---|---|---|
| 1 | Hero | `PageHero` overlay / split | Photo / white | `hero` |
| 2 | <name> | §4.x <pattern> | white / cream-50 / green-950 | `<key>` |
| n | Closing | `CtaBand` | green-950 | `cta` |

**Rhythm check:** no two dark bands next to each other, and the section before `CtaBand` is light.

## Imagery

| Slot | File in `public/images/…` | Ratio | Alt text |
|---|---|---|---|
| Hero | | | |

## New components, roles or tokens

None expected. If any are needed, give for each:
- its name
- why no existing pattern fits
- where it will be documented and shown on `/design-system`

## Content guardrails

- [ ] No statistics, counters or unverified figures
- [ ] No partner or supporter logos, and no proposed partners presented as confirmed
- [ ] No named or proposed hub locations
- [ ] No roadmaps, projections or financial claims
- [ ] Terminology follows `docs/content-rules.md`

## Responsive notes

- **375:**
- **768:**
- **1024:**
- **1440:**

## Done

- [ ] `npm run lint`, `npm run type-check` and `npm run build` pass from the repository root
- [ ] Viewed at 375 / 768 / 1024 / 1440
- [ ] Keyboard pass: visible focus, logical order
- [ ] One `h1`, no skipped heading levels
- [ ] Only design-system tokens and `type-*` roles: no new `text-[…]` sizes or hex values
- [ ] `docs/site/design-patterns.md` (or `docs/design-system.md` for shared additions) and `/design-system` updated if anything new was added
