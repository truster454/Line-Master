# Repository Guidelines

## Project Structure & Module Organization
- `line-master/` contains the Vite + TypeScript app.
- `line-master/src/` is the main source tree.
- `line-master/src/background/`, `line-master/src/content/`, and `line-master/src/shared/` are reserved for extension-style modules (background/content scripts and shared utilities).
- `line-master/src/data/` holds JSON data (e.g., `openings.json`).
- `line-master/public/` contains static assets and extension metadata (icons, `manifest.json`).
- `line-master/tests/` exists but is currently empty.

## Build, Test, and Development Commands
Run these from `line-master/`:
- `npm run dev` starts the Vite dev server.
- `npm run build` runs `tsc` type-checking and builds the production bundle.
- `npm run preview` serves the production build locally for verification.

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled (`tsconfig.json`), so keep types explicit and avoid unused locals/params.
- Use 2-space indentation in `.ts` and `.css` to match existing files.
- Prefer `camelCase` for variables/functions, `PascalCase` for types, and `kebab-case` for asset filenames.
- No formatter or linter is configured yet; keep changes minimal and consistent with nearby code.

## Testing Guidelines
- No test runner is configured and `line-master/tests/` is empty.
- If you add tests, document the chosen framework and add a `npm run test` script.
- Use descriptive test names that mirror features, e.g., `loads openings index`.

## Commit & Pull Request Guidelines
- There is no existing Git commit history, so no established convention.
- Use concise, imperative commit subjects (optionally Conventional Commits), e.g., `feat: add openings loader`.
- PRs should include a short summary, key changes, and screenshots if UI behavior changes.

## Configuration Notes
- The project is a Vite + TypeScript module-based setup (`"type": "module"`).
- JSON data under `src/data/` is bundled; large additions should be intentional.

## Product Spec (Full)
- Product type: Google Chrome extension (Manifest V3).
- Purpose: Chess “Theory Bot” with a large opening database, search, filters, favorites, and position-based recommendations.
- Modes: opening catalog, position-based recommendations, favorites, settings.
- Core entities: opening, line, rating band, opening type, difficulty, tags, ECO.
- Position sources: chess.com and lichess.org via content scripts.
- Storage: local JSON + index; `chrome.storage` for favorites and user settings.
- UI surfaces: popup, side panel, options page.
- Analytics and commentary: define interfaces now; implement later.

## Architecture (Modules & Responsibilities)
- `src/background/` hosts MV3 service worker, settings storage, and sync.
- `src/content/` extracts position/moves from sites, normalizes, and sends to UI.
- `src/core/` contains domain logic: search, filters, recommendations, formats.
- `src/data/` holds the openings database and index for fast queries.
- `src/ui/` contains all React UI (popup, panel, options) and UI state.
- `src/shared/` contains shared types, constants, utilities.

## Module Interfaces (Contracts)
- `core/openings/index.ts` exports `OpeningsService` with `search`, `recommendByPosition`, `getById`, `listAll`.
- `core/openings/schema.ts` defines `Opening`, `RatingBand`, `OpeningType`, `Difficulty`.
- `content/index.ts` exports `detectPosition(): Promise<PositionSnapshot | null>`.
- `background/storage.ts` exports `FavoritesRepo` and `SettingsRepo` for `chrome.storage`.
- `ui/state/store.ts` stores `UIState` with filters, favorites, current position.

## Work Plan (Max Detail)
1. Initialize project tooling and build system. Details: `npm create vite@latest` with `react-ts`; verify `npm run dev`; confirm baseline build.
2. Create folder structure and empty files. Details: `background/`, `content/`, `ui/`, `core/`, `data/`, `shared/`; empty entry files; stable import paths.
3. Add MV3 `manifest.json`. Details: `manifest_version: 3`, `action`, `background.service_worker`, `content_scripts`, `permissions`, `host_permissions`, `icons`.
4. Configure entry points for background/content/UI. Details: Vite config for separate bundles; popup/options/panel HTML; verify load in Chrome.
5. Scaffold background service worker. Details: init, `runtime.onMessage`, `chrome.storage` wrappers, basic logging.
6. Scaffold content script. Details: inject on domains, `detectPosition` entry, safe selectors, no-data handling.
7. Scaffold UI: popup, panel, options. Details: minimal pages, shared layout, basic styles.
8. Wire UI state layer. Details: store (zustand/Redux), actions, selectors, filters and favorites state.
9. Implement domain types (`Opening`, `RatingBand`, `OpeningType`, `Difficulty`). Details: strict types, single source of truth, constants.
10. Load openings database (JSON) in `core/openings`. Details: static import, shape validation, defaults.
11. Implement text search (name/ECO). Details: normalize input, search `name`, `eco`, `tags`, limit results.
12. Implement filters (rating, type, difficulty). Details: filter combinations, empty filter = all, stable ordering.
13. Implement position-based recommendations (move matching). Details: match move prefix, compute depth, rank by score.
14. Add openings index (by first moves/keys). Details: build `openings.index.json`, fast lookup, fallback to full scan.
15. Implement favorites with `chrome.storage`. Details: `FavoritesRepo` API, add/remove, read on startup.
16. Persist filters/settings with `chrome.storage`. Details: `SettingsRepo` API, schema migration, defaults.
17. Implement chess.com detector (moves/FEN). Details: DOM parsing, move extraction, FEN reconstruction if needed.
18. Implement lichess.org detector (moves/FEN). Details: DOM parsing, move extraction, handle game/analysis modes.
19. Normalize moves/format conversions. Details: SAN/UCI normalization, remove move numbers, ensure consistency.
20. Integrate: position -> recommendations -> UI. Details: message channel content -> background -> UI; update state; handle errors.
21. Improve UX for cards and lists. Details: compact cards, rating/type/difficulty badges, quick actions.
22. Optimize performance and caching. Details: memoize filters, cache by position, lazy list rendering.
23. Manual testing on chess.com and lichess.org. Details: test detectors in multiple modes, regressions across pages.
24. Fix defects and stabilize. Details: logging, edge-case fixes, final UX checks.
25. Package for distribution. Details: production build, size checks, prepare `dist/`.
26. Documentation for build/install. Details: `chrome://extensions` steps, config notes, limitations.

## Time Estimate (Solo)
- Minimal working version: 8–12 work days.
- Stable version with detectors and indexing: 12–18 work days.
- If the openings database is missing or needs manual curation: +5–15 work days.

## Risks & Assumptions
- Site DOM changes can break detectors.
- Large openings database requires indexing/optimization.
- Analytics and commentary require a later milestone.
