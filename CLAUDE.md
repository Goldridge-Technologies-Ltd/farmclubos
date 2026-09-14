@AGENTS.md
@docs/design-system.md

- This is a monorepo: `site/`, `webapp/`, `api/` and `packages/design-system/`. Each app has its own `AGENTS.md` and `CLAUDE.md`; follow them as well when you change that app.
- All UI work in every app follows `docs/design-system.md`. When you add or change a token, type role or shared component, update `packages/design-system/` (`styles/theme.css` or `components/`), `docs/design-system.md` and `site/app/design-system/page.tsx` in the same change.
- Run `npm install`, `npm run lint`, `npm run type-check` and `npm run build` from the repository root.
