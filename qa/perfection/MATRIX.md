# PrismCap — Perfection Loop v3 · MATRIX

Updated: 2026-10-14 · Matrix-Builder  
Legend: ✅ evidence path · ⏳ pending · N/A reason  
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

## Legacy gallery (light-only · desktop + mobile viewports)

Manifest: `docs/screenshots/gallery/gallery-manifest.json` (pre–schema v2). PNG paths relative to manifest dir.

| Screen | State | light×mobile | light×desktop | dark×* | v3 iphone/ipad/mac |
|---|---|---|---|---|---|
| S-HOME | default | ✅ `mobile-01-home.png` | ✅ `desktop-01-home.png` | ⏳ | ⏳ PRS-V3-6 |
| S-LIB | default | ✅ `mobile-02-library.png` | ✅ `desktop-02-library.png` | ⏳ | ⏳ PRS-V3-6 |
| S-DASH | default | ✅ `mobile-03-dashboard.png` | ✅ `desktop-03-dashboard.png` | ⏳ | ⏳ PRS-V3-6 |
| S-ARCADE | default | ✅ `mobile-04-arcade.png` | ✅ `desktop-04-arcade.png` | ⏳ | ⏳ PRS-V3-6 |
| S-PROF | default | ✅ `mobile-05-profile.png` | ✅ `desktop-05-profile.png` | ⏳ | ⏳ PRS-V3-6 |

## Extended inventory (INVENTORY.md)

| Entry | Status | Notes |
|---|---|---|
| S-GAME setup/play/results | ⏳ | PRS-V3-4 · per-game session gallery |
| S-PLAYERS modal | ⏳ | PRS-V3-5 |
| S-ACH · S-QR | ⏳ | PRS-V3-5 |
| Empty · offline · eco/reduced-motion | ⏳ | PRS-V3-5 |

## N/A (justified)

| Item | Reason |
|---|---|
| iPhone SE / iPad portrait vs mobile capture | §9.1 — legacy mobile viewport covers phone layout |
| wide 1920 unique chrome | No wide-only shell variant beyond desktop capture |

## Coverage rollup

| Bucket | ✅ | N/A | ⏳ |
|---|---:|---:|---:|
| Device-qa smoke | 7 | 0 | 0 |
| Legacy gallery light (10 viewport cells) | 10 | 0 | 0 |
| Dark + v3 device grid (5 tabs) | 0 | 0 | 15 |
| Extended inventory groups | 0 | 0 | 4 |
| Justified N/A | 0 | 2 | 0 |
| **Matrix %** | | | **51%** (19/37 counted cells) |
