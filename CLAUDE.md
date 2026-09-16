@AGENTS.md
@docs/design-system.md

# Farmclubos

## Monorepo

- This is a monorepo: `site/`, `webapp/`, `api/` and `packages/design-system/`. Each app has its own `AGENTS.md` and `CLAUDE.md`; follow them as well when you change that app.
- All UI work in every app follows `docs/design-system.md`. When you add or change a token, type role or shared component, update `packages/design-system/` (`styles/theme.css` or `components/`), `docs/design-system.md` and `site/app/design-system/page.tsx` in the same change.
- Run `npm install`, `npm run lint`, `npm run type-check` and `npm run build` from the repository root.
- Keep changes scoped to the app you're working in. If a change crosses apps (e.g. an API contract used by `webapp/`), update both sides in the same change.

## Skills

Do not load any skill by default. Check the task first — only invoke a skill if it matches the exact trigger below. Never invoke a skill just because it exists.

- `/architect` — before building something non-trivial with no plan yet
- `/review` — when a feature is done and needs a production check
- `/recover` — when something is broken and the fix isn't obvious
- `/remember` — at the start of a new session to restore context, and at the end to save progress

## Session continuity

REQUIRED — do not skip, do not wait to be asked:

- **First action of every session:** run `/remember restore` before doing anything else.
- **Last action of every session:** run `/remember save` before closing.
