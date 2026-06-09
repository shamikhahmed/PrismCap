# PrismOS 🎮

**38 offline games. Pass & Play. Fully offline gaming platform.**

🔗 **Live:** https://shamikhahmed.github.io/PrismOS
📱 **Optimized for iPhone** — install as PWA for best experience

---

## What is PrismOS?

PrismOS is a fully offline, installable gaming platform built as a single-page PWA. No downloads, no accounts, no internet required after first load. Designed for Pass & Play on a single device — hand it around the table and play.

---

## Games (38)

### 🎭 Social Deception
- **Shadow Protocol** — Hidden roles, suspicion, betrayal
- **Spy Hunt** — Find the spy before they escape
- **Imposter Frequency** — Detect who's faking the topic
- **Split Truth** — Truth or lie? You decide
- **Silent Vote** — Anonymous elimination voting
- **Heist** — Cooperative vault cracking with a hidden mole

### ⚡ Reflex & Speed
- **Reflex Ladder** — React faster than the target time
- **Quick Tap** — Tap the target as fast as possible
- **Rhythm Pulse** — Hit the beat, build combos

### 🧠 Strategy & Puzzles
- **AI Survival** — Survive waves of AI scenarios
- **Infinite Maze** — Navigate procedurally generated mazes
- **Memory Matrix** — Pattern recall under pressure
- **Decode Signal** — Crack the cipher before time runs out
- **Pressure** — Decision making under time pressure

### 🎲 Party & Chaos
- **Chaos Cards** — Random chaos rules every round
- **Hot Potato** — Pass before it explodes
- **Truth Bomb** — Answer or face consequences

### 🏆 Competitive
- **Snake** — Classic, with multiplayer twist
- **Tournament Mode** — Bracket play across any game

---

## Features

- **Pass & Play** — Single device, 1–10+ players with quick presets (Solo, Duo, Party, Full)
- **Bot / AI Players** — Board games (Chess, Draughts, Tic-Tac-Toe, Connect Four, Ludo, Snakes & Ladders, Blitz Duel) plus bot-fill for social games
- **Eco / Low Power Mode** — On by default for snappier performance on all devices
- **Drama Engine** — Tracks tension, trust, and paranoia across the session
- **Director Engine** — Adaptive difficulty and pacing
- **XP & Ranks** — 10 ranks from Rookie to Legend
- **16 Achievements** — Unlock through gameplay
- **10 Themes** — Cyber, Neon, Horror, Space, Gold, Synth, Midnight, Red, Glitch, Terminal
- **Daily Challenges** — New challenge every day
- **Mutators** — Game modifiers (Sudden Death, Blind Mode, Speed Mode, etc.)
- **Tournament Bracket** — 4-player bracket play
- **QR State Transfer** — Transfer game state between devices
- **Suspend & Resume** — Save and continue any game
- **Offline PWA** — Install to home screen, works without internet

---

## Performance

PrismOS defaults to **Eco / Low Power** mode for a snappier feel everywhere:

| Setting | Default | Why |
|---------|---------|-----|
| Background canvas | Off | Saves GPU on every screen |
| Background music | Off | Saves CPU + battery |
| Eco mode | On | Reduces animations and effects |
| Perf HUD | Hidden | Only visible with `?debug=1` |

Toggle **Eco / Low Power**, **Background Effects**, and **Music** in Profile → Settings.

---

## Multiplayer Setup

When launching a multiplayer game:

1. Use **+/−** or quick presets (**Solo**, **Duo**, **Party 4/6**, **Full 10**, **Max**)
2. Add humans, individual bots, or **Fill Bots** to reach your target count
3. Board games also offer **Solo**, **vs Bot**, and **Pass & Play** modes

Supported player ranges are shown per game (e.g. Shadow Protocol: 3–10 players).

---

## Tech

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES5/6) |
| Storage | localStorage |
| PWA | Service Worker (`sw.js` at repo root), Web App Manifest |
| Audio | Web Audio API (synthesized, no files) |
| Haptics | Vibration API |
| Build | None — zero build step |

---

## Install on iPhone

1. Open the live URL in **Safari**
2. **Share → Add to Home Screen**
3. Launch from home screen for full-screen PWA mode

## iPhone test checklist

- [ ] Device selection completes (iPhone model → safe areas correct)
- [ ] Welcome/onboarding flow finishes
- [ ] At least 3 games launch and complete a round
- [ ] Pass & Play player handoff works (private role reveal)
- [ ] Music toggle and haptics respond
- [ ] App works offline after first load
- [ ] Dynamic Island / notch: no UI clipped

## Documentation

| Resource | Path |
|----------|------|
| User guide | [docs/GUIDE.md](docs/GUIDE.md) |
| Presentation | [docs/PRESENTATION.md](docs/PRESENTATION.md) |
| Landing page | [landing.html](landing.html) |

## Running Locally

Open `index.html` directly in a browser, or serve with any static server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

**Debug perf HUD:** append `?debug=1` to the URL.

---

## Author

**Shamikh Ahmed**
Director, NEWS Logistics · Founder, TheSolution360
MSc Logistics & Operations Management, Cardiff University
MSc Accounting & Finance, BPP University London
Karachi, Pakistan

---

*Built with Claude Code.*
