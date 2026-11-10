# Project architecture

The browser and future mobile app use the same web source. Native platform setup and monetization are not part of this refactor.

## Source boundaries

| Location                  | Responsibility                                                            |
| ------------------------- | ------------------------------------------------------------------------- |
| `index.html`              | Page shell, dialogs, and module/style entry points                        |
| `src/main.js`             | Application controller: selection, navigation, screens, and event binding |
| `src/data/definitions.js` | Component identities, shapes, tutorial lessons, and campaign stages       |
| `src/game/rules.js`       | Pure routing, pair lookup, shield breaking, and solvability checks        |
| `src/game/generate.js`    | Seeded board generation and stage/tutorial factories                      |
| `src/game/state.js`       | Save-shape validation and plain-data snapshots                            |
| `src/platform/storage.js` | Persistence and compatibility migrations                                  |
| `src/ui/view.js`          | Board and level-selection markup                                          |
| `src/ui/components.js`    | Inline SVG character artwork                                              |
| `src/ui/effects.js`       | Wires, spark, pop particles, and animation timing                         |
| `src/styles/game.css`     | Responsive styles and reduced-motion behavior                             |

The engine has no DOM or storage dependencies. UI modules may depend on the engine, but the engine does not import UI code. Storage is created through an adapter so it can later be replaced for native persistence or cloud saves.

## Match lifecycle

1. The controller validates a pair using `route`.
2. It locks input and starts the wire effect.
3. Spark arrival starts the chip pop effect.
4. After the pop, the controller snapshots undo state, removes the pair, breaks neighboring shields, and updates progress.
5. The screen renders; a cleared stage opens the completion dialog.

Effects receive callbacks and a state reader. They do not remove chips, award wins, or unlock stages themselves. This preserves arrival-before-removal behavior.

## Content and save compatibility

Change content in `src/data/definitions.js`. Component IDs are one-based array positions stored in saves: do not reorder or remove existing components without a migration. Stage numbering, deterministic seeds, and shape keys also identify saved content.

Existing localStorage keys are preserved: `circuitState`, `circuitCampaign`, `circuitWins`, `circuitEndlessState`, and `circuitShapeChoice`. A standalone export opened at the same previous local file path keeps using that browser's existing saves. Moving to another origin, browser, or native app needs a separate migration if progress must follow.

## Build and export

`editor.html` and `src/editor/` provide the separate level workshop. The editor uses the same routing, shields, artwork, view helpers, and effects, with independent draft/test state and local storage keys. `src/game/level-format.js` validates versioned level JSON. `src/data/authored-levels.js` holds deliberate campaign overrides and contiguous appended stages.

Vite serves ES modules during development and bundles them into `dist/` for production. The relative asset base supports static hosting and a future Capacitor web directory.

`scripts/export.mjs` bundles each source entry independently through Vite into a standalone HTML file in `exports/`. This avoids external shared chunks when opening either export from disk. It does not maintain another copy of game logic. Edit `src/` and rebuild; do not edit generated output.

## Verification

`tests/engine.mjs` imports real modules with no browser. Integration tests use a small source-graph loader and fake DOM/storage/animation surfaces. They cover tutorial flow, campaign saves/unlocks, 300 wall layouts, undo, and spark/pop sequencing. These checks do not replace visual testing on a browser or phone.
