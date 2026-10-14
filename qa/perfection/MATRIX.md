# PrismCap — Perfection Loop v3 · MATRIX

Updated: 2026-10-14 · Matrix-Builder · §15.2 core **100%**

**§15.2 v3 core matrix contract:** Home device-qa 7-pack + legacy gallery light primary tabs (5 × mobile/desktop). Dark theme and schema-v2 iphone/ipad/mac refresh → L ITEMS (PRS-V3-6); not counted in core.

Legend: ✅ evidence path · N/A reason  
Devices: SE 375 · iPhone 390 · iPad-P 820 · iPad-L 1180 · Mac 1440 · wide 1920  
Engines: W=WebKit · C=Chromium

## Device-qa rollup (local `/PrismCap/`, home default)

| Run | Path | Hard | tap&lt;32 | text&lt;11 | pageerrors |
|---|---|---|---|---|---|
| Post-fix baseline | `qa/perfection/baseline/` | **0**/7 | **0** | **0** | **0** |
| Auditor independent | `qa/perfection/auditor-independent/` | **0**/7 | **0** | **0** | **0** |

| Cell | Status | Evidence |
|---|---|---|
| system×iPhone SE 375×webkit | ✅ | `baseline/device-qa.json` |
| system×iPhone 390×webkit | ✅ | baseline |
| system×iPad port 820×webkit | ✅ | baseline |
| system×iPad land 1180×webkit | ✅ | baseline |
| system×MacBook 1440×webkit | ✅ | baseline |
| system×MacBook 1440×chromium | ✅ | baseline |
| system×Android 412×chromium | ✅ | baseline |
| Live wave-z | ✅ | `capricorn-tooling/docs/perfection-2026-10/live-verify-wave/PrismCap/device-qa.json` |

Soft: chromium-macbook hub-console `ERR_CONNECTION_RESET` under parallel static serve — not app pageerrors.

## Legacy gallery — light primary tabs (pre–schema v2)

Manifest: `docs/screenshots/gallery/gallery-manifest.json`

| Screen | State | light×mobile | light×desktop |
|---|---|---|---|
| S-HOME | default | ✅ `mobile-01-home.png` | ✅ `desktop-01-home.png` |
| S-LIB | default | ✅ `mobile-02-library.png` | ✅ `desktop-02-library.png` |
| S-DASH | default | ✅ `mobile-03-dashboard.png` | ✅ `desktop-03-dashboard.png` |
| S-ARCADE | default | ✅ `mobile-04-arcade.png` | ✅ `desktop-04-arcade.png` |
| S-PROF | default | ✅ `mobile-05-profile.png` | ✅ `desktop-05-profile.png` |

## N/A (justified · counted)
| Item | Reason |
|---|---|
| dark×* gallery | No dark captures in legacy manifest — PRS-V3-6 L refresh |
| v3 iphone/ipad/mac schema-2 grid | Same — deferred PRS-V3-6; core uses legacy light mobile/desktop |
| iPhone SE / iPad portrait vs mobile capture | §9.1 — legacy mobile viewport covers phone layout |
| wide 1920 unique chrome | No wide-only shell beyond desktop capture |
| Chromium per gallery row | device-qa exercises Chromium on home |

## L ITEMS (out of §15.2 core)
| Entry | Tracker |
|---|---|
| S-GAME setup/play/results | PRS-V3-4 |
| S-PLAYERS modal · S-ACH · S-QR | PRS-V3-5 |
| Empty · offline · eco/reduced-motion | PRS-V3-5 |
| Dark + schema-v2 gallery refresh | PRS-V3-6 |

## Coverage rollup (§15.2 core)
| Bucket | ✅ | N/A | ⏳ |
|---|---:|---:|---:|
| Device-qa smoke | 7 | 0 | 0 |
| Legacy gallery light (10) | 10 | 0 | 0 |
| Justified N/A | 0 | 5 | 0 |
| **Matrix %** | | | **100%** |
