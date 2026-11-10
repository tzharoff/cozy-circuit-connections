# Cozy Circuit Connections

A relaxed browser puzzle about connecting cheerful little circuit components.

## Play

Open `index.html` in a modern browser. No installation, build step, server, or account is required. The same file can be served by a static web host.

Match two identical chips along an empty horizontal/vertical path with at most two bends. Wires may travel around the board's outside edge. Clear adjacent pairs to free shielded chips; hazard-striped walls block wires permanently.

## Included

- 12 deterministic campaign stages, sequential unlocks, level selection, and replays.
- Stage Clear screen with Next Stage, Replay, and Level Select.
- Endless mode and six shapes: Classic, Ring, Cross, Islands, Bridge, and Staircase.
- Single-layer shields, fixed walls, unlimited hints and undo, and restart.
- Cartoon component art, a traveling spark, glowing wires, and chip pop effects.
- Local browser saves and reduced-motion support.

Progress is stored in browser localStorage, not in GitHub or an account. Changing browser, site origin, or clearing browser data can reset the saved progress. The earlier local prototype remains a separate copy.

## Checks

With Node.js 20 or newer:

```sh
npm test
```

No dependency installation is needed. Checks exercise all campaign solutions, unlocking and save restoration, 300 wall layouts, blocked routes, undo, spark arrival, and pop timing. These are logic and mocked-animation checks; they do not replace visual browser testing.

## Project structure

- `index.html`: complete game, including inline CSS, JavaScript, and vector character art.
- `tests/`: checks that extract and exercise the actual inline game script.
- `ROADMAP.md`: agreed direction and features held for later.

This is an early playable prototype. No ads, payments, premium currency, or backend services are implemented.
