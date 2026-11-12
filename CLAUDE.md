# Working in this repo

## Git: always stay in sync

The owner switches machines constantly (a Windows PC builds Android, a Mac builds iOS), so work must never sit only on one machine.

- **Start of a session:** run `git pull` on `main` before changing anything. If there are local changes or the pull conflicts, stop and ask.
- **"Commit" means commit and push.** After committing, push to `origin` in the same step, unless the owner says otherwise ("just commit", "don't push").
- Never force-push. Don't push work the owner hasn't asked to commit.

## UI wording

Screens use as little text as possible: the level goes in the card heading, and buttons are one word.

- **Continue:** the main button on screens between levels (the level clear card).
- **Play:** the main button going from the main menu or home screen into a level.
- **Chip’ums:** the characters' name. On screen use "Chip’ums" with a curly apostrophe; in code, files, and URLs use `chipums`. They are planned as plush toys and 3D prints, so keep their designs simple and on-palette (see docs/GAME_DESIGN.md).

## Builds: always bump the build number

Whenever you prepare a build the owner will install or upload (an iOS build to run on a phone, TestFlight, or the App Store; an Android APK or bundle), run `npm run revision` first, without being asked. It bumps the build number in `version.json`, iOS, and Android together. Then run `npm run cap:sync`, build, and commit and push the bumped version files with the build. Quick simulator builds made only to check your own work don't need a bump.

## Project pointers

- Overview, commands, and mobile builds: [README.md](README.md)
- Source boundaries and save compatibility: [ARCHITECTURE.md](ARCHITECTURE.md)
- Direction and design decisions: [ROADMAP.md](ROADMAP.md), [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)
- Before committing: `npm test` and `npm run format:check` should pass. After changing `src/`, run `npm run cap:sync` before a native build.
