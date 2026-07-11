# PrismCap — Roadmap

> Updated 2026-07-11. Fleet order & standard: `capricorn-tooling/shared/CAP-STANDARD.md`.

## Now — v4.2.0
Current shipped state. See `CHANGELOG.md` for how we got here.

## Cap Standard gaps
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ❌ |
| Version discipline | ✅ |
| QA / e2e | 🟡 |
| CI gate | ❌ |
| PWA polish | ✅ |
| Demo mode | ✅ |

## Next (ordered)
1. CI: Pages deploy workflow with test gate (currently NO workflows)
2. Screen gallery: hub + representative game screens (all 38 = overkill; pick ~10)
3. `verify` script per Cap Standard

## Later
- Game completion audit — verify all 38 playable end-to-end
- Score history export

## Ground rules
- No dirty trees: commit or discard before ending a session.
- CI green before tag; tag `vX.Y.Z` per release.
- Bump SW cache with any asset change (PWA apps).
- Never commit `.env` / secrets.
