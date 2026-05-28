# PrismOS

PrismOS has been migrated from a single HTML file to a modular TypeScript + Vite project.

## Run locally

```bash
npm install
npm run dev
```

## Current status

- Modular structure created (`src/app`, `src/core`, `src/games`, `src/ui`, `src/pwa`, `src/state`)
- PWA basics added (`manifest.webmanifest`, `sw.js`, install prompt hook)
- Legacy app preserved at:
  - `public/legacy/PrismOS-v12.html`

## Migration plan

1. Extract shared systems (event bus, save manager, audio, haptics, device profile)
2. Port launcher/dashboard/home screens into modular UI components
3. Port games one by one into `src/games/`
4. Replace legacy fallback with native modular runtime
5. Harden offline sync, resilience, and test coverage

