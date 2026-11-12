# Cozy Circuit Connections

A relaxed browser puzzle about connecting cheerful little circuit components.

Match identical chips along an empty horizontal/vertical path with at most two bends. Cables must stay inside the compact 6×6 board; there are no outside wire lanes. Clear adjacent pairs to free shielded chips; hazard-striped walls block wires permanently.

## Develop

Use Node.js **22.12 or newer** and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Source modules need an HTTP server; double-clicking the source `index.html` is not the development workflow.

Open `/editor.html` for the **Level Workshop**: paint chips, shields, walls, and shapes; load stages; check solutions; play-test; save drafts; and import/export levels. See [the editor guide](docs/LEVEL_EDITOR.md) for replacing or appending campaign stages.

Open `/playroom.html` for the **Play room**: a test board with sliders for the zap line (wire) and pop animation speeds. Tap Zap (or turn on Loop) to watch and hear a connection at the current speeds, and use the Sounds board to play every sound effect. Changes save in that browser and apply to the game there too; **Copy values** gives the numbers to make them the shipped defaults in `src/ui/timing.js`.

## Build, preview, or export

```sh
npm run build
npm run preview
```

`dist/` is the production web app, ready for static hosting and used as the Capacitor web directory.

## iOS and Android

Capacitor wraps `dist/` in the native projects under `android/` and `ios/` (app ID `com.tonyinthegame.cozycircuit`, set in `capacitor.config.json`). After changing `src/`, rebuild and copy the web app into both projects:

```sh
npm run cap:sync
```

`npm run android` syncs and opens Android Studio, which supplies the JDK and runs the app on an emulator or device. `npm run ios` syncs and opens Xcode; it needs a Mac, so on Windows use a Mac or a cloud build service for iOS. Android needs JDK 21 and SDK Platform 36. Without Android Studio, set `JAVA_HOME` to the JDK and run `gradlew assembleDebug` in `android/`; the APK is `android/app/build/outputs/apk/debug/app-debug.apk`. Do not edit the copied web assets inside the native projects; edit `src/` and sync.

For a standalone file you can double-click:

```sh
npm run export
```

Open `exports/Cozy Circuit Connections.html`. Code, styles, and artwork are embedded, so gameplay works offline. No account is required.

The export also creates `exports/Cozy Circuit Connections - Level Editor.html`, a standalone workshop.

## Check and format

```sh
npm test
npm run format:check
npm run format
```

Checks cover the tutorial, 12 stage solutions, unlocks and save restoration, 300 wall layouts, wall-aware routing, undo, Charges and Recharge, and spark/pop timing. Engine tests import real modules. UI integration checks use fake browser surfaces; visual testing is still needed on real devices.

## Included

- Guided Level 0: matching, bends, shields, and walls.
- 12 deterministic stages played in order: progress only moves forward, Toon Blast style.
- A home screen with the chip crew and a Play button for the next level; side columns are reserved for challenge icons.
- Tutorial completion and Stage Clear screens.
- A burnt "Short circuit!" failed card and persistent board notice when no pairs can connect, with undo/restart recovery.
- Endless mode and six board shapes.
- Synthesized sound effects (no audio files) for selecting, the zap line, pops, shields, cards, Charges, and Chip Coins, with a sound on/off button on home and in the menu.
- Charges (lives) on a battery counter: restarting a level after making matches spends one, they refill every 30 minutes up to five, and at zero a Recharge refills them for Chip Coins.
- Single-layer shields, walls, one free hint per level (more for Chip Coins), unlimited undo, and restart.
- Cartoon SVG components, traveling sparks, glowing wires, and pop effects.
- Browser saves, responsive layouts, and reduced-motion support.

Progress is saved locally, not in GitHub or an account. Changing browser or origin, or clearing browser data, can reset progress. Existing save keys are preserved by this refactor.

## Code organization

`src/game/` contains the browser-independent engine; `src/data/` holds content; `src/ui/` holds artwork, effects, and view helpers; `src/platform/` handles persistence. `src/main.js` coordinates gameplay and screens.

See [ARCHITECTURE.md](ARCHITECTURE.md) for source boundaries, the match lifecycle, and save compatibility. See [ROADMAP.md](ROADMAP.md) for the agreed direction.

The detailed gameplay, lives, currency, rotating challenges, and social-race notes are in [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md). That document distinguishes decisions from implemented features and open questions.

This is a playable prototype. Native saves, phone polish (safe areas, icons, splash, haptics), ads, payments, a Chip Coin shop, and backend services are not implemented yet.

## Version and build numbers

`version.json` is the source of truth for the release version and build number.
Run `npm run revision` before preparing each new device/TestFlight/App Store build;
it increments the build number and synchronizes iOS (Debug and Release), Android,
and package metadata. Build numbers continue increasing across release versions.
To change the release version, edit `version.json` and run `npm run version:sync`.
Then run `npm run cap:sync` and build in Xcode. Current baseline: 0.1.0 (2).
The product title remains a working name; revision numbering does not rename the app.
