# PrismCap — Perfection v3 ITEMS
Seeded from §13.3 + Builder probe 2026-10-14. Status: only Auditor sets ✅ VERIFIED.

### PRS-V3-1 — tiny text (~200 nodes at 11px / captions)
severity: P1     status: ✅ VERIFIED
Where: home / library / game chrome · Evidence: pre-fix probe 187×11px; post `qa/perfection/baseline/device-qa.json` textUnder11=0
Cause: Widespread `0.6875rem` (11px) + `.7/.72rem` labels for LV chips, category, Smart Hub, game HUD.
Fix: Bulk bump `0.6875rem` / `.7rem` / `.72rem` → `0.75rem` (12px) in `css/*`, `js/app.js`, `index.html`; `cap-stat-tile-lbl` 11→12px.
Test: device-qa 7/7 `text<11px` = 0
Auditor: ✅ VERIFIED 2026-10-14T11:30:00Z — auditor-independent 7/7 hard=0 tap=0 text=0 pageErr=0 @ 29d9266

### PRS-V3-2 — small targets Change / + Add / favourites
severity: P1     status: ✅ VERIFIED
Where: settings rows + Smart Hub favourite stars · Evidence: Change/+Add h=25; fav w=32
Cause: Inline `padding:5px 12px` buttons without `.btn`; fav `padding:8px 8px` width 32.
Fix: `js/app.js` — Change / + Add use `.btn.bg.bsm.srow-action`; fav uses `.fav-btn`. `css/components.css` — `.bsm`/`.srow-action`/`.fav-btn` min 44×44.
Test: device-qa 7/7 `tap<32px` = 0; probe Change 90×44, +Add 78×44, fav 44×44
Auditor: ✅ VERIFIED 2026-10-14T11:30:00Z — auditor-independent 7/7 hard=0 tap=0 text=0 pageErr=0 @ 29d9266

### PRS-V3-3 — merge finish/prismcap-stepR
severity: P1     status: ✅ VERIFIED
Where: main @ fd25c5d · Conductor merge already on main; perfection branch cut from tip.
Auditor: ✅ VERIFIED 2026-10-14T11:30:00Z — auditor-independent 7/7 hard=0 tap=0 text=0 pageErr=0 @ 29d9266

### PRS-V3-4 — game-session gallery shots
severity: P2     status: ⏳ OPEN
Where: FEATURES L · every game setup/play/results × themes — Phase G

### PRS-V3-5 — Lighthouse to §7.11
severity: P2     status: ⏳ OPEN
Where: home, library, one heavy game — Phase I
