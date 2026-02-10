# Codex Agent Guide (chess_teoryBot/line-master)

This file is for me (the agent). It should be enough to understand the repo without extra context.

## Repo Shape
- Root is `/Users/grigory/Documents/chess_teoryBot/line-master`.
- Vite + TypeScript (ESM). Chrome Extension (Manifest V3).
- UI is React + Tailwind, migrated from a Next.js design project.

### Key Directories
- `src/background/`: MV3 service worker, storage, sync.
- `src/content/`: content scripts for chess.com / lichess.org.
- `src/shared/`: shared types, constants, logger.
- `src/core/`: domain logic (openings, filters, recommenders, formatters).
- `src/data/`: bundled JSON (`openings.json`, `openings.index.json`).
- `src/components/`, `src/hooks/`, `src/lib/`: UI code (migrated from Next.js).
- `src/ui/`: extension surface entrypoints (popup/panel/options) + styles.
- `public/`: static assets, icons, `manifest.json`.

### Entry Points
- Popup: `popup.html` → `src/ui/popup/main.tsx`.
- Panel: `panel.html` → `src/ui/panel/main.tsx`.
- Options: `options.html` → `src/ui/options/main.tsx`.
- Background: `src/background/index.ts` (built as `background.js`).
- Content: `src/content/index.ts` (built as `content.js`).
- Dev hub: `index.html` (links to popup/panel/options).

### Configs
- `vite.config.ts`: multi-entry build, `@` alias to `src`.
- `tailwind.config.ts`: Tailwind v3 config.
- `postcss.config.mjs`.
- `tsconfig.json`: strict TS + JSON module imports.

## Commands (run from repo root)
- `npm run dev` → Vite dev server.
- `npm run build` → `tsc` + production bundle.
- `npm run preview` → serve production bundle.

## Runtime / Load in Chrome
1. `npm run build`.
2. Load unpacked: `chrome://extensions` → Developer Mode → Load unpacked → `dist/`.
3. Refresh extension after rebuilds.

## Product Spec Summary
- Chrome extension: opening database, search, filters, favorites, position recommendations.
- Sources: chess.com + lichess.org (content scripts).
- Storage: `chrome.storage` for favorites + settings.
- Surfaces: popup, side panel, options.

## Core Interfaces (contracts)
- `src/core/openings/index.ts`: `OpeningsService` with `search`, `recommendByPosition`, `getById`, `listAll`.
- `src/core/openings/schema.ts`: `Opening`, `RatingBand`, `OpeningType`, `Difficulty`.
- `src/content/index.ts`: `detectPosition(): Promise<PositionSnapshot | null>`.
- `src/background/storage.ts`: `FavoritesRepo` + `SettingsRepo`.
- `src/ui/state/store.ts`: `UIState` shape.

## Constraints / Style
- 2-space indentation in `.ts`/`.css`.
- Prefer `camelCase` variables, `PascalCase` types, `kebab-case` assets.
- Avoid unused locals/params (TS strict).
- No formatter configured — keep changes minimal.

## Full Work Plan (detailed)
1. Tooling baseline
   - Ensure Vite + TS strict builds clean.
   - Verify multi-entry build for popup/options/panel/background/content.

2. Extension scaffolding
   - MV3 `manifest.json` includes action popup, options, side panel, background, content scripts, icons.
   - Build emits `background.js` and `content.js` alongside HTML entries.

3. Background service worker
   - Wire `runtime.onMessage` and storage helpers.
   - Add basic logging and health/ping.

4. Content scripts
   - Implement `detectPosition` for chess.com + lichess.org.
   - Normalize moves / FEN extraction.
   - Send position snapshots to background/UI.

5. Domain layer
   - Define `Opening` schema and enums.
   - Load JSON data, validate shape.
   - Implement search (name/ECO/tags).
   - Implement filters (rating/type/difficulty/tags).
   - Implement recommendations by move-prefix.

6. Data/index
   - Build `openings.index.json` for fast lookup.
   - Add fallback to full scan if index missing.

7. UI integration
   - Connect UI to store/state, wire filters & favorites.
   - Connect to background messages (position updates).
   - Ensure popup/panel/options render correct pages.

8. UX polish
   - Cards, badges, quick actions, loading/empty states.
   - Performance: memoize filters, cache by position.

9. Storage
   - `FavoritesRepo` add/remove/list.
   - `SettingsRepo` with defaults + migration stub.

10. Testing & stabilization
   - Manual testing on chess.com + lichess.
   - Fix DOM breakages, edge cases.
   - Optional tests + add `npm run test`.

11. Packaging
   - `npm run build` and verify `dist/`.
   - Document installation in README.

## Current Known State / Caveats
- UI is mocked with local data in `src/lib/chess-data.ts`.
- Position detection is stubbed (`detectPosition` returns null).
- Favorites/settings storage not fully wired to UI yet.
- React is pinned to 18 for dependency compatibility.

## Agent Notes
- Prefer `rg` for search.
- Prefer `apply_patch` for single-file edits.
- Avoid deleting or reformatting unrelated files.
