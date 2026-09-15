# PrismCap — STATES

**Status:** Automated TIER1 PASS · VO not linked  
**Updated:** 2026-09-15 (4.5.2)

| State | Primary journey | Status | Notes |
|---|---|---|---|
| first use | arcade home / demo | ✅ | `?demo=1` seeds; `__APP_READY__` |
| empty | home with no saves | ✅ | empty honesty copy |
| loading | boot → arcade | ✅ | splash then ready flag |
| success | launch game + play | ✅ | games-play / tier1 e2e |
| error | invalid / missing game | ✅ | toast / stay on arcade |
| offline | SW cache | ✅ | PWA precache brand + shell |
| no results | search filter | ✅ | arcade search empty |
| partial data | suspended game | ✅ | Suspend save/resume |
| permission denied | notifications / install | ⏭ | install prompt optional |
| expired session | N/A | N/A | no server session |
| invalid input | CapPrompt / settings | ✅ | CapPrompt dialog |
| destructive confirmation | leave game | ✅ | CapConfirm / requestLeave |
| network failure | N/A offline-first | N/A | no required network |
| server failure | N/A | N/A | static Pages |
| slow network | first paint | ⏭ | not separately timed |
| interrupted operation | Escape leave | ✅ | requestLeave |
