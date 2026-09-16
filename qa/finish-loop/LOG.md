# PrismCap — LOG

## 2026-09-15 — C-23 stub
- Finish-loop record set created (BASELINE, LOG, STATES, DOCS-INVENTORY)
- Gaps then: Tier 1 incomplete, matrix/LH pending

## 2026-09-15 — §14 #12 TIER1 close (4.5.2)
- PCBrand palette + app-tokens/runtime CSS (brandOk)
- Hex / !important / native dialogs cleared from product paths
- `requestLeave` rename (harness `xit(` false positive)
- SINKS.md · lighthouse stub · finish-matrix smoke spec · `test:matrix` script
- VERSION/SW/package **4.5.2** / `prismcap-v452`
- `npm run tier1` → PASS (warn: matrix:shots)

## 2026-09-15 — 4.5.3 CI fix
- addInitScript hist color literal (PCBrand not in init scope)
- CapConfirm z-index 1200

- CI https://github.com/shamikhahmed/PrismCap/actions/runs/34972484644 success · tag `v4.5.3` · merge `332c79c`

## 2026-09-16 — C-40
### §15 mini-plan
- Problem: sub-11px labels; emoji/symbols in nav controls; purple greeting contrast; uppercase caption labels.
- Root cause: .nil/.sl/.cab tiny rem; unicode nic; gradient text-fill; uppercase .sec.
- Files: layout.css, components.css, index.html, app.js
- Change: ≥0.6875rem captions; SVG nav icons; solid greeting color; text-caption tokens; Multiplayer/Solo plain.
- Risks: game-body emoji elsewhere still present (in-game decoration).
- Verification: nav SVG; greeting readable; section labels sentence-case ≥11px.

### 2026-09-16 C-57 Pages allowlist
- **Problem:** Pages published repo-root internals (HANDOVER/CLAUDE/qa/worker/package.json).
- **Root cause:** deploy copied (nearly) the whole tree.
- **Change:** `scripts/stage-pages-site.sh` + `verify-pages-artifact.cjs`; workflow stages allowlisted paths only.
- **Verification:** local stage dry-run + SW precache check; live curl after deploy.

## 2026-09-16 — Finish Review 3 follow-up (finish/prismcap-stepR)
- Committed: C-29 tokens.css + CSS var migration; C-31 finish-matrix CI job; capture-axe.mjs; gallery regen; CI-WORKFLOW; skip-allowlist; honest TIER1 FAIL (was stale PASS).
- Left uncommitted: none.
- Not merging (Tier1 FAIL: matrix-results / empty LH / axe / gallery freshness still open until CI runs).

## 2026-09-16 — residual a11y (cats scroll region)
- Committed: `tabindex=0` + `role=navigation` on `#cats` (scrollable-region-focusable); honest TIER1 still FAIL (empty LH + remaining axe).

## 2026-09-16 — axe re-capture after #cats focusable
- Committed: axe JSON now 0 serious/critical; honest TIER1 refresh.

## 2026-09-16 — real Lighthouse + matrix refresh (Step R evidence)
- Tool: `_workspace` lighthouse 13.4.1 vs local `http.server` `/?demo=1` (mobile + desktop).
- Wrote `qa/finish-loop/lighthouse/home-demo-{mobile,desktop}.json` (real UA, non-null scores — no stubs).
- Scores (honest): mobile perf 43 / a11y 100 / bp 96 (LCP~2.2s TBT~11.7s CLS~0.26); desktop perf 73 / a11y 98 / bp 96.
- Refreshed matrix-results + 6 shots; axe already 0 serious/critical.
- Not claiming lighthouse:passing or Tier 1 PASS.
