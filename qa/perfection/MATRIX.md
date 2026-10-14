# PrismCap — Perfection v3 MATRIX
Wave B focus: home device-qa gate for PRS-V3-1/2.

## Device-qa rollup (local `/PrismCap/`, 2026-10-14T11:14:03Z)
| Run | Path | Hard | tap&lt;32 | text&lt;11 | pageerrors |
|---|---|---|---|---|---|
| Post-fix baseline | `qa/perfection/baseline/` | **0**/7 | **0** | **0** | **0** |

Soft: chromium-macbook 3× `ERR_CONNECTION_RESET` hub-console under parallel static serve — not app pageerrors. WebKit 5/5 clean.

## Priority screens
| Screen | State | device-qa home | Notes |
|---|---|---|---|
| S-HOME | default | ✅ 7/7 | PRS-V3-1/2 |
| S-LIB | default | ⏳ Auditor spot | same CSS floor |
| S-GAME | play | ⏳ Phase C–G | gallery PRS-V3-4 |
