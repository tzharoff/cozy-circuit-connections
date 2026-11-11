# Working in this repo

## Git: always stay in sync

The owner switches machines constantly (a Windows PC builds Android, a Mac builds iOS), so work must never sit only on one machine.

- **Start of a session:** run `git pull` on `main` before changing anything. If there are local changes or the pull conflicts, stop and ask.
- **"Commit" means commit and push.** After committing, push to `origin` in the same step, unless the owner says otherwise ("just commit", "don't push").
- Never force-push. Don't push work the owner hasn't asked to commit.

## Project pointers

- Overview, commands, and mobile builds: [README.md](README.md)
- Source boundaries and save compatibility: [ARCHITECTURE.md](ARCHITECTURE.md)
- Direction and design decisions: [ROADMAP.md](ROADMAP.md), [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)
- Before committing: `npm test` and `npm run format:check` should pass. After changing `src/`, run `npm run cap:sync` before a native build.
