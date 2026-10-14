# PrismCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/PrismCap.md` before working here.  
> Last updated: 2026-10-14 · Fleet: `capricorn-tooling/docs/perfection-2026-10/CURSOR-PERFECTION-LOOP.md`

## What this is
Party games for one phone, passed around the room. Offline Pass & Play PWA (never “PrismOS” — G-3).

## Facts
**Version:** 4.6.0 / SW `prismcap-v460`  
**Live:** https://shamikhahmed.github.io/PrismCap  
**Repo:** https://github.com/shamikhahmed/PrismCap  
**Branch (active):** `main` (`v4.6.0`)  
**Stack:** Vanilla JS PWA. Game registry (`js/games/`). Playwright tests.  
**Data:** localStorage for scores/settings. Fully offline after first load — no Capricorn sync, no third-party APIs.

## Run & verify
```bash
python3 -m http.server 8767   # or npm run serve
npm run verify                # Playwright smoke
npm run gallery               # shell screens (CAPTURE_GALLERY=1)
# Device QA (fleet):
# PW_CORE=…/MasteryCap/node_modules/playwright-core \
# PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright \
# node ../capricorn-tooling/scripts/device-qa.mjs qa/perfection/check \
#   --apps=PrismCap --url=PrismCap=http://127.0.0.1:8768/PrismCap/
```

Perfection state: `qa/perfection/STATE.md`.

## Architecture
- `js/app.js` — shell, toasts, settings, keyboard tab cycling, SW register
- `js/games/` — one module per game
- `css/` — CRT / arcade identity; type floor ≥12px on perfection branch (PRS-V3-1)
- `privacy.html` — network honesty (same-origin / GitHub Pages only)

## Gotchas
- Toast recursion bug fixed in bf23028 — don't call toast from within toast dismiss handlers.
- Keyboard tab cycling is deliberate a11y work — regression-test when touching nav.
- Game-session gallery shots still OPEN (PRS-V3-4).

## Where decisions live
- Binding: `capricorn-tooling/docs/audit-2026-09-14/DECISIONS.md` (§4.1)
- Perfection items: `qa/perfection/ITEMS.md`
- Changelog: `CHANGELOG.md`

## Deploy
Own GitHub Pages via `.github/workflows/pages.yml` on `main` → https://shamikhahmed.github.io/PrismCap/  
Bump VERSION.json + package + SW cache + register query together (G-8).

**Hub note (§12.5):** `shamikhahmed.github.io/PrismCap/` is a **stale copy** — do not rsync. Hub Engineer removes it after confirming own-Pages serves live (keep redirects).
