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
