# PrismCap — BASELINE

**Date:** 2026-09-15  
**Status:** Automated TIER1 PASS (VO ⛔ — fleet Tier 1 not claimed)  
**Version:** 4.5.2 · **SW:** `prismcap-v452`

## Verify snapshot
`npm run tier1` → PASS (see `qa/finish-loop/TIER1.json`). Warn: `matrix:shots` until FINISH_MATRIX run captures screenshots.

## Closed in this slice (§14 #12)
- Kill-list: PCBrand (`js/brand/colors.js`), `css/app-tokens.css` / `css/app-runtime.css`
- Suppressions FP: `GL.requestLeave` / `_origGLLeaveFn` (avoid `xit(` matcher)
- SINKS.md · LH stub · finish-matrix.spec.mjs · C-10 `npm run tier1`

## Still open
- matrix:shots (warn only)
- VoiceOver / physical device (BLOCKED-EXTERNAL)
- Honest full Lighthouse (C-22) — stub present; scores not claimed
