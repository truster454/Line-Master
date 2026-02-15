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
- `src/data/`: bundled JSON (`openings.json`, `openings.index.json`, `books.index.json`).
- `src/components/`, `src/hooks/`, `src/lib/`: UI code (migrated from Next.js).
- `src/ui/`: extension popup entrypoint + styles.
- `public/`: static assets, icons, `manifest.json`, opening books in `public/books/*.bin`.

### Entry Points
- Popup: `popup.html` → `src/ui/popup/main.tsx`.
- Background: `src/background/index.ts` (built as `background.js`).
- Content: `src/content/index.ts` (built as `content.js`).
- `index.html` redirects to `popup.html`.

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
- Surface: popup only (no side panel/options).

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

## Full Work Plan (detailed, historical)
1. Tooling baseline
   - Ensure Vite + TS strict builds clean.
   - Verify multi-entry build for popup/options/panel/background/content.

2. Extension scaffolding
   - MV3 `manifest.json` includes action popup, background, content scripts, icons.
   - Build emits `background.js`, `content.js`, and popup HTML/JS.

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
   - Ensure popup renders correctly.

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

## Completed Work (2026-02-14)
### 1) Popup-only architecture
- Removed side panel/options from manifest:
  - deleted `options_ui` and `side_panel` from `public/manifest.json`.
- Removed side panel/options from build inputs in `vite.config.ts`.
- Deleted unused entry files:
  - `panel.html`, `options.html`
  - `src/ui/panel/main.tsx`, `src/ui/panel/Panel.tsx`
  - `src/ui/options/main.tsx`, `src/ui/options/Options.tsx`
- Updated dev entry:
  - `index.html` now redirects to `popup.html`.
- Updated Tailwind content list:
  - removed references to `panel.html` and `options.html`.

### 2) TypeScript build fixes
- Fixed strict TS errors in UI files (unused vars/imports, type-only imports):
  - `src/components/home-screen.tsx`
  - `src/components/popup-library.tsx`
  - `src/components/popup-settings.tsx`
  - `src/components/theme-provider.tsx`
  - `src/components/ui/calendar.tsx`
  - `src/components/ui/form.tsx`
  - `src/components/ui/pagination.tsx`
  - `src/components/ui/sidebar.tsx`
- Build status: `npm run build` passes.

### 3) Opening books (.bin) integration foundation
- Books are stored in: `public/books/*.bin`.
- Added web access for books in extension:
  - `public/manifest.json` → `web_accessible_resources` with `books/*.bin`.
- Added auto-generated books index:
  - `src/data/books.index.json` (`openingId -> books/<file>.bin`).
- Added `BookService`:
  - `src/core/books/service.ts`
  - supports listing books, resolving book path by opening id/name, loading `.bin` via `chrome.runtime.getURL`, and in-memory cache.
- Extended `OpeningsService`:
  - `src/core/openings/index.ts`
  - added `recommendByPositionWithBooks`, `loadBookForOpeningId`, `loadBookForOpening`, `listBooks`.

### 4) Popup sizing
- Updated popup container to extension-like dimensions:
  - `src/ui/popup/Popup.tsx` uses fixed `380x560` container instead of full-screen layout.

### 5) Important remaining gaps
- `src/data/openings.json` is currently empty (`[]`), so opening recommendations from core data are limited.
- Position detectors are still stubs:
  - `src/content/detectors/chesscom.ts`
  - `src/content/detectors/lichess.ts`
- Book move extraction from `.bin` by FEN/Polyglot key is not implemented yet (only loading/indexing is done).

## Completed Work (2026-02-15)
### 1) Real Polyglot lookup from `.bin`
- Implemented full `.bin` lookup pipeline in `src/core/books/service.ts`:
  - FEN parsing and Polyglot key generation (including castling/en-passant handling).
  - Binary search by key in Polyglot book records.
  - Decoding moves to UCI and selecting candidates by weight.
  - Lookup across all books (`lookupAllByFen`) for aggregated theory moves.
- Added Polyglot random table in `src/core/books/polyglot-random.ts`.

### 2) Real openings data and index
- Filled `src/data/openings.json` with real entries matched to existing books.
- Rebuilt `src/data/openings.index.json`.
- `openings.json` now includes metadata and preview moves for library cards; recommendation logic is based on `.bin` lookup, not these preview lines.

### 3) Position detection on chess.com/lichess
- Implemented detectors:
  - `src/content/detectors/chesscom.ts`
  - `src/content/detectors/lichess.ts`
- Added move normalization in `src/content/normalize.ts`.
- Added FEN validation in `src/content/fen-utils.ts`.
- Added board-based FEN fallback reconstruction in `src/content/fen-from-board.ts` when site FEN is missing/invalid.

### 4) End-to-end flow (`content -> background -> popup`)
- `src/content/index.ts` now continuously reports position updates (observer + polling) and listens for state updates.
- `src/background/index.ts` now:
  - stores latest position insight,
  - computes aggregated theoretical moves from all matching books,
  - exposes `position:get`,
  - broadcasts `position:state`,
  - handles favorites API (`favorites:list/add/remove`).

### 5) On-board move overlay
- Added SVG overlay renderer in `src/content/overlay.ts`:
  - draws line from source square to target square,
  - draws target circle,
  - supports rendering all theoretical moves,
  - uses reduced size/transparency for minimal board obstruction,
  - auto-refreshes on resize/scroll.

### 6) Launch-gated hints (show only after pressing “Запустить”)
- Added `hintsEnabled` state in `PositionInsight` (`src/shared/types.ts`).
- Added background message handlers:
  - `hints:get`
  - `hints:set`
  with persistence in `chrome.storage.local`.
- `src/components/home-screen.tsx` button “Запустить” now toggles hints.
- `src/content/overlay.ts` clears overlay when `hintsEnabled === false`.
- `src/content/index.ts` periodically syncs `hints:get` to ensure immediate overlay toggle even when position does not change.

### 7) Popup UI state
- Popup pages were temporarily migrated to core-driven minimal views, then reverted to the original visual design per user request.
- Current state:
  - original popup visual style is retained,
  - home screen includes an additional bottom data block with live position/book details,
  - functional backend/content pipeline remains active.

## Completed Work (2026-02-15, optimization follow-up)
### 1) Runtime optimization without behavior change (base profile)
- `src/content/index.ts`:
  - Added queued reporting with debounce + in-flight guard to avoid parallel `position:update` spam.
  - Added forced report path only on key events (focus/visibility/setting changes).
  - Reduced redundant UI redraws by checking last insight timestamp.
- `src/content/detectors/chesscom.ts` and `src/content/detectors/lichess.ts`:
  - Added throttled script scanning for FEN extraction and URL-aware cache.
  - Kept board reconstruction as fallback only when site FEN is missing/invalid.
- `src/core/books/service.ts`:
  - Kept Polyglot binary search by key.
  - Added lookup memoization (cache by Polyglot key) and precomputed books list.
  - Reduced allocations in best-candidate selection.

### 2) Performance mode in settings (standard/economy)
- Added new mode type and insight field:
  - `src/shared/types.ts` → `PerformanceMode = 'standard' | 'economy'`
  - `PositionInsight.performanceMode`
- Added background API + persistence:
  - `src/background/index.ts`:
    - storage key `performanceMode`
    - messages: `performance:get`, `performance:set`, `settings:get`
    - mode included in `position:state` payload.
- Added settings UI block:
  - `src/components/popup-settings.tsx`:
    - new section `Производительность` with `Стандартный` and `Экономия`
    - default is `Стандартный`
    - persisted via runtime messages.

### 3) Economy profile behavior (intentionally more aggressive)
- `src/content/index.ts` applies profile-based runtime tuning:
  - `standard`: poll `2500ms`, settings sync `6000ms`, debounce `120ms`, no mutation throttle.
  - `economy`: poll `5200ms`, settings sync `10000ms`, debounce `280ms`, mutation throttle `850ms`.
- `src/content/overlay.ts`:
  - supports optional render cap; in economy mode shows up to 3 theoretical moves on board (reduces overlay/SVG load).

### 4) Fix for mode persistence race
- Root cause: MV3 service worker could process early messages before async storage load completed, temporarily falling back to `standard`.
- Fix in `src/background/index.ts`:
  - added gated settings initialization (`refreshSettingsFromStorage`) before handling
    `position:get`, `hints:get`, `performance:get`, `settings:get`, `position:update`, `hints:set`, `performance:set`.
  - ensures `economy` survives worker cold starts and applies immediately after reload.

## Completed Work (2026-02-15, books replacement compatibility)
### 1) Reindexed books after replacing `.bin` set
- User replaced `public/books/*.bin` with a significantly smaller, more general set.
- Rebuilt `src/data/books.index.json` from actual files currently present in `public/books`.
- Removed stale mappings to deleted files and added mappings for newly introduced files.

### 2) Added family-level fallback mapping for openings
- Problem: `openings.json` remains fine-grained (many sub-variations), while new books are grouped by broader families.
- Fix in `src/core/books/service.ts`:
  - Kept exact matching by opening `id`/`name` first.
  - Added fallback resolver that maps detailed openings/tags to available family books when exact file is absent.
  - Implemented family rules for key groups (e.g. King's Indian, Nimzo-Indian, Queen's Gambit/QGD family, Open Game/Spanish family, Scotch, Owen/Nimzowitsch).
- Result: all openings in `src/data/openings.json` now resolve to a book path (exact or family fallback), so lookup pipeline remains functional with fewer books.

### 3) Validation outcome
- Verified coverage after changes: `openings=65`, `mapped=65`, `miss=0`.
- Build status after changes: `npm run build` passes.

### 4) Books preset folder prep (`general`)
- Moved current books to `public/books/general/*.bin` to prepare for multiple presets.
- Updated path dependencies:
  - `src/data/books.index.json` now points to `books/general/<file>.bin`
  - `public/manifest.json` web-accessible resources include nested `books/*/*.bin`
  - `scripts/import-polyglot-books.mjs` defaults to importing into `public/books/general` and writes `books/general/...` paths.

## Agent Notes
- Prefer `rg` for search.
- Prefer `apply_patch` for single-file edits.
- Avoid deleting or reformatting unrelated files.
