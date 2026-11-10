# Cozy Circuit Connections

A relaxed browser puzzle about connecting cheerful little circuit components.

Match identical chips along an empty horizontal/vertical path with at most two bends. Wires may travel around the outside edge. Clear adjacent pairs to free shielded chips; hazard-striped walls block wires permanently.

## Develop

Use Node.js **22.12 or newer** and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Source modules need an HTTP server; double-clicking the source `index.html` is not the development workflow.

## Build, preview, or export

```sh
npm run build
npm run preview
```

`dist/` is the production web app, ready for static hosting or a future Capacitor wrapper.

For a standalone file you can double-click:

```sh
npm run export
```

Open `exports/Cozy Circuit Connections.html`. Code, styles, and artwork are embedded, so gameplay works offline. No account is required.

## Check and format

```sh
npm test
npm run format:check
npm run format
```

Checks cover the tutorial, 12 stage solutions, unlocks and save restoration, 300 wall layouts, wall-aware routing, undo, and spark/pop timing. Engine tests import real modules. UI integration checks use fake browser surfaces; visual testing is still needed on real devices.

## Included

- Guided Level 0: matching, bends, shields, and walls.
- 12 deterministic stages, saved unlocks, level selection, and replays.
- Tutorial completion and Stage Clear screens.
- A clear no-moves dialog and persistent board notice, with undo/restart recovery.
- Endless mode and six board shapes.
- Single-layer shields, walls, free hints, unlimited undo, and restart.
- Cartoon SVG components, traveling sparks, glowing wires, and pop effects.
- Browser saves, responsive layouts, and reduced-motion support.

Progress is saved locally, not in GitHub or an account. Changing browser or origin, or clearing browser data, can reset progress. Existing save keys are preserved by this refactor.

## Code organization

`src/game/` contains the browser-independent engine; `src/data/` holds content; `src/ui/` holds artwork, effects, and view helpers; `src/platform/` handles persistence. `src/main.js` coordinates gameplay and screens.

See [ARCHITECTURE.md](ARCHITECTURE.md) for source boundaries, the match lifecycle, and save compatibility. See [ROADMAP.md](ROADMAP.md) for the agreed direction.

The detailed gameplay, lives, currency, rotating challenges, and social-race notes are in [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md). That document distinguishes decisions from implemented features and open questions.

This is a playable prototype. Capacitor, ads, payments, premium currency, and backend services are not implemented yet.
