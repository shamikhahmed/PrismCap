# PrismCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/PrismCap.md` before working here.
> Last updated: 2026-07-11 · Fleet-wide standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
38 offline Pass & Play games PWA (former PrismOS merged in).

## Facts
**Version:** 4.2.0
**Live:** https://shamikhahmed.github.io/PrismCap
**Repo:** https://github.com/shamikhahmed/PrismCap
**Stack:** Vanilla JS PWA. Game registry pattern (`js/games/`). Playwright tests.
**Data:** Local storage for scores/settings. Fully offline.

## Run & verify
```bash
python3 -m http.server 8000   # static
npm run test:e2e              # if wired — verify
```

## Architecture
- `js/app.js` — shell, toasts, settings, keyboard tab cycling
- `js/games/` — one module per game (example-game.js is the template)
- `js/cap-demo-mode.js`, `js/cap-desktop-nav.js` — added 2026-07-11
- `css/capricorn-core.css` — shared design system

## Cap Standard status (2026-07-11)
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ❌ |
| Version discipline | ✅ |
| QA / e2e | 🟡 |
| CI gate | ❌ |
| PWA polish | ✅ |
| Demo mode | ✅ |

Gaps are tracked as tasks in `ROADMAP.md`.

## Gotchas — read before coding
- Toast recursion bug fixed in bf23028 — don't call toast from within toast dismiss handlers.
- Keyboard tab cycling is deliberate a11y work — regression-test when touching nav.

## Where decisions live
- Dated decisions: Capricorn-Brain project note (path above)
- Release history: `CHANGELOG.md`
- Fleet-level events: `Cap-Apps/docs/CHANGELOG.md` (master)
